import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { billingService } from '@/lib/billing-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, successUrl, cancelUrl } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Create checkout session
    const checkoutSession = await billingService.createCheckoutSession(
      session.user.id,
      planId,
      session.user.email,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url
    })

  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current billing information
    const billing = await billingService.getBillingInfo(session.user.id)
    const usage = await billingService.getUsageMetrics(session.user.id)

    return NextResponse.json({
      success: true,
      billing,
      usage
    })

  } catch (error) {
    console.error('Failed to get billing info:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve billing information' },
      { status: 500 }
    )
  }
}