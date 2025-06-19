import Stripe from 'stripe'

// Initialize Stripe only if API key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
      telemetry: false
    })
  : null

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
  successUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/dashboard/billing/success',
  cancelUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/dashboard/billing/canceled'
}

// Subscription plans configuration
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number // in cents
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
  popular?: boolean
  videoLimit: number
  aiAnalysisLimit: number
  storageGB: number
  premiumFeatures: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    interval: 'month',
    features: [
      '5 videos per month',
      'Basic AI analysis',
      '1GB storage',
      'Standard support'
    ],
    stripePriceId: '', // No Stripe price for free plan
    videoLimit: 5,
    aiAnalysisLimit: 5,
    storageGB: 1,
    premiumFeatures: false
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'For content creators and influencers',
    price: 2900, // $29/month
    interval: 'month',
    features: [
      '100 videos per month',
      'Advanced AI analysis',
      '50GB storage',
      'Premium templates',
      'Priority support',
      'Social media scheduling'
    ],
    stripePriceId: 'price_creator_monthly', // Replace with actual Stripe price ID
    popular: true,
    videoLimit: 100,
    aiAnalysisLimit: 100,
    storageGB: 50,
    premiumFeatures: true
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For agencies and teams',
    price: 9900, // $99/month
    interval: 'month',
    features: [
      'Unlimited videos',
      'Premium AI analysis',
      '500GB storage',
      'Team collaboration',
      'White-label options',
      'API access',
      'Dedicated support'
    ],
    stripePriceId: 'price_agency_monthly', // Replace with actual Stripe price ID
    videoLimit: -1, // Unlimited
    aiAnalysisLimit: -1, // Unlimited
    storageGB: 500,
    premiumFeatures: true
  }
]

// Annual plans (20% discount)
export const ANNUAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'creator-annual',
    name: 'Creator Annual',
    description: 'Save 20% with annual billing',
    price: 27840, // $278.40/year (20% off $348)
    interval: 'year',
    features: [
      '100 videos per month',
      'Advanced AI analysis',
      '50GB storage',
      'Premium templates',
      'Priority support',
      'Social media scheduling',
      '20% annual discount'
    ],
    stripePriceId: 'price_creator_annual',
    popular: true,
    videoLimit: 100,
    aiAnalysisLimit: 100,
    storageGB: 50,
    premiumFeatures: true
  },
  {
    id: 'agency-annual',
    name: 'Agency Annual',
    description: 'Save 20% with annual billing',
    price: 95040, // $950.40/year (20% off $1188)
    interval: 'year',
    features: [
      'Unlimited videos',
      'Premium AI analysis',
      '500GB storage',
      'Team collaboration',
      'White-label options',
      'API access',
      'Dedicated support',
      '20% annual discount'
    ],
    stripePriceId: 'price_agency_annual',
    videoLimit: -1,
    aiAnalysisLimit: -1,
    storageGB: 500,
    premiumFeatures: true
  }
]

// Get all plans (monthly + annual)
export const ALL_PLANS = [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS]

// Helper functions
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return ALL_PLANS.find(plan => plan.id === planId)
}

export const getPlanByStripePriceId = (priceId: string): SubscriptionPlan | undefined => {
  return ALL_PLANS.find(plan => plan.stripePriceId === priceId)
}

export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(price / 100)
}

export const isFreePlan = (planId: string): boolean => {
  return planId === 'free'
}

export const isPremiumPlan = (planId: string): boolean => {
  const plan = getPlanById(planId)
  return plan?.premiumFeatures === true
}

// Usage validation
export const validateUsage = (
  currentUsage: {
    videosThisMonth: number
    aiAnalysisThisMonth: number
    storageUsedGB: number
  },
  planId: string
): {
  videosAvailable: boolean
  aiAnalysisAvailable: boolean
  storageAvailable: boolean
  upgradeRequired: boolean
} => {
  const plan = getPlanById(planId)
  
  if (!plan) {
    return {
      videosAvailable: false,
      aiAnalysisAvailable: false,
      storageAvailable: false,
      upgradeRequired: true
    }
  }

  const videosAvailable = plan.videoLimit === -1 || currentUsage.videosThisMonth < plan.videoLimit
  const aiAnalysisAvailable = plan.aiAnalysisLimit === -1 || currentUsage.aiAnalysisThisMonth < plan.aiAnalysisLimit
  const storageAvailable = currentUsage.storageUsedGB < plan.storageGB

  return {
    videosAvailable,
    aiAnalysisAvailable,
    storageAvailable,
    upgradeRequired: !videosAvailable || !aiAnalysisAvailable || !storageAvailable
  }
}

// Webhook event types
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated'
} as const

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[keyof typeof STRIPE_WEBHOOK_EVENTS]