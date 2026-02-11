import { NextRequest, NextResponse } from 'next/server'
import { disconnectLinkedIn } from '@/lib/social/linkedin/tokens'
import { z } from 'zod'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
})

/**
 * POST /api/auth/linkedin/disconnect
 * Disconnect LinkedIn account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId } = RequestSchema.parse(body)

    await disconnectLinkedIn(postId)

    return NextResponse.json({
      success: true,
      message: 'LinkedIn account disconnected',
    })
  } catch (error) {
    logError('LinkedIn disconnect error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        error: 'Failed to disconnect LinkedIn',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
