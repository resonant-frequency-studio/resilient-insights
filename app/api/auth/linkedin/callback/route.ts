import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  getLinkedInProfile,
} from '@/lib/social/linkedin/oauth'
import { storeLinkedInTokens } from '@/lib/social/linkedin/tokens'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

/**
 * GET /api/auth/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/studio?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/studio?error=missing_code_or_state', request.url)
      )
    }

    // Decode state to get postId and returnUrl
    let stateData: { postId: string; returnUrl?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/studio?error=invalid_state', request.url)
      )
    }

    const { postId, returnUrl } = stateData

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code)

    // Get user profile
    const profile = await getLinkedInProfile(tokenResponse.access_token)

    // Calculate expiration
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    // Store tokens in Sanity
    await storeLinkedInTokens(postId, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: expiresAt.toISOString(),
      profileId: profile.id,
      connectedAt: new Date().toISOString(),
    })

    // Redirect back to Studio
    // If returnUrl is a full URL (from state), use it directly
    // Add success parameter to trigger refresh
    if (
      returnUrl &&
      (returnUrl.startsWith('http://') || returnUrl.startsWith('https://'))
    ) {
      const url = new URL(returnUrl)
      url.searchParams.set('linkedin_connected', 'true')
      return NextResponse.redirect(url.toString())
    }

    // Fallback: construct redirect path
    const redirectPath = returnUrl || `/studio/desk/post;${postId}`
    const redirectUrl = new URL(redirectPath, request.url)
    redirectUrl.searchParams.set('linkedin_connected', 'true')
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    logError('LinkedIn OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/studio?error=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_failed')}`,
        request.url
      )
    )
  }
}
