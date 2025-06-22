import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "../../../../utils/supabase/server"

import { billingService } from '../../../../lib/billing-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, successUrl, cancelUrl } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Create checkout session
    const checkoutSession = await billingService.createCheckoutSession(
      user.id,
      planId,
      user.email,
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
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current billing information
    const billing = await billingService.getBillingInfo(user.id)
    const usage = await billingService.getUsageMetrics(user.id)

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