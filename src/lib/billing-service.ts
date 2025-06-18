import { stripe, STRIPE_CONFIG, getPlanById, getPlanByStripePriceId } from './stripe-config'
import { supabaseAdmin } from './supabase'
import type { SubscriptionPlan } from './stripe-config'

export interface CustomerBilling {
  customerId: string
  subscriptionId?: string
  planId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete'
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
}

export interface UsageMetrics {
  userId: string
  videosThisMonth: number
  aiAnalysisThisMonth: number
  storageUsedGB: number
  lastReset: Date
}

export class BillingService {
  /**
   * Create Stripe customer for user
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      })

      // Save customer ID to database
      await supabaseAdmin
        .from('profiles')
        .update({ 
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      console.log(`Created Stripe customer ${customer.id} for user ${userId}`)
      return customer.id

    } catch (error) {
      console.error('Failed to create Stripe customer:', error)
      throw new Error('Failed to create billing profile')
    }
  }

  /**
   * Get or create Stripe customer
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if customer already exists in database
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      if (profile?.stripe_customer_id) {
        // Verify customer exists in Stripe
        try {
          await stripe.customers.retrieve(profile.stripe_customer_id)
          return profile.stripe_customer_id
        } catch {
          // Customer doesn't exist in Stripe, create new one
          return await this.createCustomer(userId, email, name)
        }
      }

      // Create new customer
      return await this.createCustomer(userId, email, name)

    } catch (error) {
      console.error('Failed to get or create customer:', error)
      throw error
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    email: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const plan = getPlanById(planId)
      if (!plan || !plan.stripePriceId) {
        throw new Error('Invalid plan selected')
      }

      const customerId = await this.getOrCreateCustomer(userId, email)

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1
          }
        ],
        success_url: successUrl || STRIPE_CONFIG.successUrl,
        cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
        metadata: {
          userId,
          planId
        },
        subscription_data: {
          metadata: {
            userId,
            planId
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto'
        }
      })

      if (!session.url) {
        throw new Error('Failed to create checkout session')
      }

      console.log(`Created checkout session ${session.id} for user ${userId}, plan ${planId}`)

      return {
        sessionId: session.id,
        url: session.url
      }

    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw new Error('Failed to start subscription process')
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string, returnUrl?: string): Promise<{ url: string }> {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      if (!profile?.stripe_customer_id) {
        throw new Error('No billing profile found')
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: returnUrl || `${STRIPE_CONFIG.successUrl}/dashboard/billing`
      })

      return { url: session.url }

    } catch (error) {
      console.error('Failed to create portal session:', error)
      throw new Error('Failed to access billing portal')
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, immediately: boolean = false): Promise<void> {
    try {
      const billing = await this.getBillingInfo(userId)
      if (!billing?.subscriptionId) {
        throw new Error('No active subscription found')
      }

      if (immediately) {
        await stripe.subscriptions.cancel(billing.subscriptionId)
      } else {
        await stripe.subscriptions.update(billing.subscriptionId, {
          cancel_at_period_end: true
        })
      }

      console.log(`Subscription ${billing.subscriptionId} canceled for user ${userId}`)

    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    try {
      const billing = await this.getBillingInfo(userId)
      if (!billing?.subscriptionId) {
        throw new Error('No subscription found')
      }

      await stripe.subscriptions.update(billing.subscriptionId, {
        cancel_at_period_end: false
      })

      console.log(`Subscription ${billing.subscriptionId} reactivated for user ${userId}`)

    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
      throw new Error('Failed to reactivate subscription')
    }
  }

  /**
   * Get billing information for user
   */
  async getBillingInfo(userId: string): Promise<CustomerBilling | null> {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id, subscription_id, subscription_status, plan_id')
        .eq('id', userId)
        .single()

      if (!profile?.stripe_customer_id) {
        return null
      }

      // Get current subscription from Stripe if we have subscription ID
      if (profile.subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(profile.subscription_id)
          
          return {
            customerId: profile.stripe_customer_id,
            subscriptionId: subscription.id,
            planId: profile.plan_id || 'free',
            status: subscription.status as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        } catch {
          // Subscription not found in Stripe, user is on free plan
          return {
            customerId: profile.stripe_customer_id,
            planId: 'free',
            status: 'active'
          }
        }
      }

      // No subscription, user is on free plan
      return {
        customerId: profile.stripe_customer_id,
        planId: profile.plan_id || 'free',
        status: 'active'
      }

    } catch (error) {
      console.error('Failed to get billing info:', error)
      return null
    }
  }

  /**
   * Get usage metrics for user
   */
  async getUsageMetrics(userId: string): Promise<UsageMetrics> {
    try {
      const { data: usage, error } = await supabaseAdmin
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !usage) {
        // Create default usage record
        const defaultUsage = {
          user_id: userId,
          videos_generated: 0,
          ai_analysis_count: 0,
          storage_used_gb: 0,
          last_reset: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        await supabaseAdmin
          .from('user_usage')
          .insert(defaultUsage)

        return {
          userId,
          videosThisMonth: 0,
          aiAnalysisThisMonth: 0,
          storageUsedGB: 0,
          lastReset: new Date()
        }
      }

      return {
        userId,
        videosThisMonth: usage.videos_generated || 0,
        aiAnalysisThisMonth: usage.ai_analysis_count || 0,
        storageUsedGB: usage.storage_used_gb || 0,
        lastReset: new Date(usage.last_reset)
      }

    } catch (error) {
      console.error('Failed to get usage metrics:', error)
      throw new Error('Failed to retrieve usage information')
    }
  }

  /**
   * Update usage metrics
   */
  async updateUsage(
    userId: string, 
    increment: {
      videos?: number
      aiAnalysis?: number
      storageGB?: number
    }
  ): Promise<void> {
    try {
      const currentUsage = await this.getUsageMetrics(userId)

      await supabaseAdmin
        .from('user_usage')
        .update({
          videos_generated: currentUsage.videosThisMonth + (increment.videos || 0),
          ai_analysis_count: currentUsage.aiAnalysisThisMonth + (increment.aiAnalysis || 0),
          storage_used_gb: Math.max(0, currentUsage.storageUsedGB + (increment.storageGB || 0)),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

    } catch (error) {
      console.error('Failed to update usage:', error)
      throw new Error('Failed to update usage metrics')
    }
  }

  /**
   * Reset monthly usage (called by cron job)
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_usage')
        .update({
          videos_generated: 0,
          ai_analysis_count: 0,
          last_reset: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      console.log(`Reset monthly usage for user ${userId}`)

    } catch (error) {
      console.error('Failed to reset monthly usage:', error)
      throw error
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      console.log(`Processing Stripe webhook: ${event.type}`)

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object)
          break

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object)
          break

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object)
          break

        default:
          console.log(`Unhandled webhook event: ${event.type}`)
      }

    } catch (error) {
      console.error('Failed to handle webhook event:', error)
      throw error
    }
  }

  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    const userId = subscription.metadata?.userId
    if (!userId) return

    const plan = getPlanByStripePriceId(subscription.items.data[0]?.price?.id)
    
    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        plan_id: plan?.id || 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    console.log(`Updated subscription for user ${userId}: ${subscription.status}`)
  }

  private async handleSubscriptionCanceled(subscription: any): Promise<void> {
    const userId = subscription.metadata?.userId
    if (!userId) return

    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_id: null,
        subscription_status: 'canceled',
        plan_id: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    console.log(`Canceled subscription for user ${userId}`)
  }

  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    // Reset usage on successful payment for new billing period
    const customerId = invoice.customer
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      await this.resetMonthlyUsage(profile.id)
    }
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    // Handle failed payment - could send notification email
    console.log(`Payment failed for customer: ${invoice.customer}`)
  }
}

export const billingService = new BillingService()