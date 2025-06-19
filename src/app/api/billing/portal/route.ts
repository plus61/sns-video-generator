import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"

import { billingService } from '@/lib/billing-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { returnUrl } = await request.json()

    // Create customer portal session
    const portalSession = await billingService.createPortalSession(
      user.id,
      returnUrl
    )

    return NextResponse.json({
      success: true,
      url: portalSession.url
    })

  } catch (error) {
    console.error('Portal session creation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to access billing portal',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}