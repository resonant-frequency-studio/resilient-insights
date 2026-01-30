import { NextRequest, NextResponse } from 'next/server'
import { getFacebookAuthUrl } from '@/lib/social/facebook/oauth'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

/**
 * GET /api/auth/facebook
 * Initiate Facebook OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')
    const returnUrl = searchParams.get('returnUrl')

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    // Generate state with postId and returnUrl for callback
    const state = Buffer.from(
      JSON.stringify({
        postId,
        returnUrl: returnUrl || undefined,
      })
    ).toString('base64')

    // Generate OAuth URL
    const authUrl = getFacebookAuthUrl(state)

    return NextResponse.json({
      authUrl,
      state,
    })
  } catch (error) {
    logError('Facebook OAuth initiation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
