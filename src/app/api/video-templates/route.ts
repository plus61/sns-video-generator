import { NextResponse } from 'next/server'
import { getVideoTemplates } from '../../../lib/database'

export async function GET() {
  try {
    const templates = await getVideoTemplates()

    return NextResponse.json({
      templates,
      total: templates.length
    })
  } catch (error) {
    console.error('Error fetching video templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}