import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getUserPages,
} from '@/lib/social/facebook/oauth'
import { storeFacebookTokens } from '@/lib/social/facebook/tokens'
import { getInstagramBusinessAccount } from '@/lib/social/instagram/api'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

/**
 * GET /api/auth/facebook/callback
 * Handle Facebook OAuth callback
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

    // Exchange code for short-lived user access token
    const tokenResponse = await exchangeCodeForToken(code)

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedToken = await exchangeForLongLivedToken(
      tokenResponse.access_token
    )

    // Get user's pages to select a page
    // For MVP, we'll take the first page. In production, allow user to select
    const pagesResponse = await getUserPages(longLivedToken.access_token)

    if (!pagesResponse.data || pagesResponse.data.length === 0) {
      return NextResponse.redirect(
        new URL('/studio?error=no_pages_found', request.url)
      )
    }

    // Use the first page (in production, allow user to select)
    const selectedPage = pagesResponse.data[0]

    // Try to get Instagram Business Account ID if linked
    let instagramBusinessAccountId: string | undefined
    try {
      instagramBusinessAccountId = await getInstagramBusinessAccount(
        selectedPage.access_token,
        selectedPage.id
      )
    } catch {
      // Instagram not linked or not available - this is okay, user can still use Facebook
      // We'll silently fail and continue
    }

    // Calculate expiration (long-lived tokens last 60 days)
    const expiresAt = new Date(
      Date.now() + longLivedToken.expires_in * 1000
    ).toISOString()

    // Store tokens in Sanity
    // Page access token is included in the page data
    await storeFacebookTokens(postId, {
      accessToken: selectedPage.access_token, // Page access token
      userAccessToken: longLivedToken.access_token, // Long-lived user token
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      ...(instagramBusinessAccountId && { instagramBusinessAccountId }),
      expiresAt,
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
      url.searchParams.set('facebook_connected', 'true')
      return NextResponse.redirect(url.toString())
    }

    // Fallback: construct redirect path
    const redirectPath = returnUrl || `/studio/desk/post;${postId}`
    const redirectUrl = new URL(redirectPath, request.url)
    redirectUrl.searchParams.set('facebook_connected', 'true')
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    logError('Facebook OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/studio?error=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_failed')}`,
        request.url
      )
    )
  }
}
