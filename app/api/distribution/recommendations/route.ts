import { NextRequest, NextResponse } from 'next/server'
import { getRecommendedTimes, Channel } from '@/lib/scheduler/recommendations'
import { validateAuth } from '@/lib/auth/validateDistribution'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

/**
 * GET /api/distribution/recommendations
 * Get recommended posting times for a channel and date
 */
export async function GET(request: NextRequest) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const channel = searchParams.get('channel') as Channel | null
    const date = searchParams.get('date')
    const timezone = searchParams.get('timezone') || 'UTC'
    const count = parseInt(searchParams.get('count') || '5', 10)

    if (!channel || !date) {
      return NextResponse.json(
        { error: 'channel and date are required' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    const recommendations = getRecommendedTimes(
      channel,
      dateObj,
      timezone,
      count
    )

    return NextResponse.json({
      success: true,
      recommendations: recommendations.map(r => r.toISOString()),
      channel,
      date: dateObj.toISOString(),
      timezone,
    })
  } catch (error) {
    logError('Get recommendations error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
