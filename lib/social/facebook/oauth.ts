/**
 * Facebook OAuth helper functions
 */

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

export interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface FacebookLongLivedTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface FacebookPage {
  id: string
  name: string
  access_token: string
}

export interface FacebookPagesResponse {
  data: FacebookPage[]
}

/**
 * Generate Facebook OAuth authorization URL
 */
export function getFacebookAuthUrl(state?: string): string {
  const appId = process.env.FACEBOOK_APP_ID
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    'http://localhost:3000/api/auth/facebook/callback'

  if (!appId) {
    throw new Error('FACEBOOK_APP_ID is not configured')
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope:
      'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish',
    response_type: 'code',
    state: state || Math.random().toString(36).substring(2, 15),
  })

  return `${FACEBOOK_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for user access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<FacebookTokenResponse> {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    'http://localhost:3000/api/auth/facebook/callback'

  if (!appId || !appSecret) {
    throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are required')
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })

  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message ||
      `Facebook token exchange failed: ${response.status}`
    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Exchange short-lived user access token for long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<FacebookLongLivedTokenResponse> {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are required')
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  })

  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message ||
      `Facebook long-lived token exchange failed: ${response.status}`
    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Get user's Facebook Pages
 * Returns pages that the user can manage
 */
export async function getUserPages(
  userAccessToken: string
): Promise<FacebookPagesResponse> {
  const response = await fetch(
    `${FACEBOOK_GRAPH_API_BASE}/me/accounts?access_token=${userAccessToken}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message || `Failed to get Facebook pages: ${response.status}`
    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Get page access token for a specific page
 * This is already included in the getUserPages response, but we can also get it directly
 */
export async function getPageAccessToken(
  pageId: string,
  userAccessToken: string
): Promise<string> {
  // First get all pages to find the matching one
  const pagesResponse = await getUserPages(userAccessToken)
  const page = pagesResponse.data.find(p => p.id === pageId)

  if (!page) {
    throw new Error(`Page ${pageId} not found or not accessible`)
  }

  return page.access_token
}
