import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getUserUsage } from '@/lib/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const usage = await getUserUsage(session.user.id)

    if (!usage) {
      return NextResponse.json(
        { error: 'Failed to fetch user usage' },
        { status: 500 }
      )
    }

    // Calculate monthly usage
    const now = new Date()
    
    // This would normally be calculated in the database query
    // For now, we'll return the basic usage info
    return NextResponse.json({
      videos_generated: usage.videos_generated,
      monthly_limit: usage.monthly_limit,
      remaining: Math.max(0, usage.monthly_limit - usage.videos_generated),
      last_generation_at: usage.last_generation_at,
      reset_date: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    })
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}