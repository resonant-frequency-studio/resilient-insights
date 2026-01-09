import { NextRequest, NextResponse } from 'next/server'
import { runDistribution } from '@/lib/distribution/runDistribution'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/distribution/gemini'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  articleId: z.string(),
  channels: z.array(z.enum(['linkedin', 'facebook', 'instagram'])).min(1),
  publishAt: z.string().optional(), // ISO 8601 date string
  force: z.boolean().optional().default(false),
})

import { validateAuth } from '@/lib/auth/validateDistribution'

/**
 * Generate request ID for observability
 */
function generateRequestId(): string {
  return `dist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * POST /api/distribution/generate-and-schedule
 * Generate social content and optionally schedule posts via Inngest
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { articleId, channels, publishAt, force } = RequestSchema.parse(body)

    // Rate limiting: 1 request per 5 minutes per articleId
    const rateLimitKey = `schedule:${articleId}`
    const SCHEDULE_RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
    if (!checkRateLimit(rateLimitKey, SCHEDULE_RATE_LIMIT_WINDOW)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'Please wait 5 minutes before scheduling again for this article',
          requestId,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '300', // 5 minutes
          },
        }
      )
    }

    // Validate publishAt if provided
    if (publishAt) {
      const publishDate = new Date(publishAt)
      if (isNaN(publishDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid publishAt date format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }
      if (publishDate < new Date()) {
        return NextResponse.json(
          { error: 'publishAt must be in the future' },
          { status: 400 }
        )
      }
    }

    // Call shared server module
    const result = await runDistribution({
      articleId,
      channels,
      publishAt,
      force,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Distribution failed',
          requestId,
          previews: result.previews,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      scheduledPostIds: result.scheduledPostIds,
      requestId,
      previews: result.previews,
    })
  } catch (error) {
    console.error(`[${requestId}] Distribution error:`, error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.issues,
          requestId,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}
