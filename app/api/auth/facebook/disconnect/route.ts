import { NextRequest, NextResponse } from 'next/server'
import { disconnectFacebook } from '@/lib/social/facebook/tokens'
import { z } from 'zod'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
})

/**
 * POST /api/auth/facebook/disconnect
 * Disconnect Facebook account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId } = RequestSchema.parse(body)

    await disconnectFacebook(postId)

    return NextResponse.json({
      success: true,
      message: 'Facebook account disconnected',
    })
  } catch (error) {
    logError('Facebook disconnect error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        error: 'Failed to disconnect Facebook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
