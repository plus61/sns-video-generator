import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { billingService } from '@/lib/billing-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { returnUrl } = await request.json()

    // Create customer portal session
    const portalSession = await billingService.createPortalSession(
      session.user.id,
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