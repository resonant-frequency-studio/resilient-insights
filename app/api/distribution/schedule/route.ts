import { NextRequest, NextResponse } from 'next/server'
import { schedulePost } from '@/lib/scheduler/schedule'
import { z } from 'zod'
import { validateAuth } from '@/lib/auth/validateDistribution'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  articleId: z.string(),
  channel: z.enum(['linkedin', 'facebook', 'instagram']),
  content: z.string().min(1),
  scheduledAt: z.string(), // ISO 8601
  imageUrl: z.string().url().optional(),
})

/**
 * POST /api/distribution/schedule
 * Schedule a post to be published at a specific time
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { articleId, channel, content, scheduledAt, imageUrl } =
      RequestSchema.parse(body)

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduledAt date format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'scheduledAt must be in the future' },
        { status: 400 }
      )
    }

    // Schedule the post
    const result = await schedulePost({
      articleId,
      channel,
      content,
      scheduledAt,
      imageUrl,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to schedule post',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scheduledPostId: result.scheduledPostId,
      message: 'Post scheduled successfully',
    })
  } catch (error) {
    console.error('Schedule post error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
