import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitStatus } from '@/lib/distribution/gemini'
import { z } from 'zod'
import { logWarn, logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  postId: z.string(),
  contentType: z.enum([
    'newsletter',
    'linkedin',
    'facebook',
    'instagram',
    'social',
    'medium',
  ]),
})

/**
 * Validate authentication header
 */
function validateAuth(request: NextRequest): boolean {
  const secret = process.env.DISTRIBUTION_SECRET
  if (!secret) {
    logWarn('DISTRIBUTION_SECRET is not set')
    return false
  }

  const headerSecret = request.headers.get('X-DISTRIBUTION-SECRET')
  return headerSecret === secret
}

/**
 * GET /api/distribution/rate-limit-status
 * Get current rate limit status for a post and content type
 */
export async function GET(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const contentType = searchParams.get('contentType')

    if (!postId || !contentType) {
      return NextResponse.json(
        { error: 'postId and contentType are required' },
        { status: 400 }
      )
    }

    const validated = QuerySchema.parse({ postId, contentType })
    const rateLimitKey = `${validated.contentType}:${validated.postId}`
    const status = getRateLimitStatus(rateLimitKey)

    return NextResponse.json({
      rateLimited: !status.allowed,
      remainingMs: status.remainingMs || 0,
    })
  } catch (error) {
    // Only log unexpected errors, not validation errors (400s are expected)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    logError('Rate limit status error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check rate limit status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
