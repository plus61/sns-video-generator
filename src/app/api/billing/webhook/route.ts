import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe-config'
import { billingService } from '@/lib/billing-service'

export async function POST(request: NextRequest) {
  // Return early if Stripe is not configured
  if (!stripe) {
    console.warn('Stripe webhook received but Stripe not configured')
    return NextResponse.json({ received: true }, { status: 200 })
  }

  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.webhookSecret
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`Received Stripe webhook: ${event.type}`)

    // Handle the event
    try {
      await billingService.handleWebhookEvent(event)
      
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully'
      })

    } catch (error) {
      console.error('Webhook processing failed:', error)
      
      // Return 200 to avoid Stripe retries for application errors
      // Log the error for manual investigation
      return NextResponse.json({
        success: false,
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}