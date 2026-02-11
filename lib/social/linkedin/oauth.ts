/**
 * LinkedIn OAuth helper functions
 */

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

export interface LinkedInTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface LinkedInProfile {
  id: string // This will be the 'sub' from OpenID Connect userinfo
  firstName?: {
    localized: Record<string, string>
    preferredLocale: { language: string; country: string }
  }
  lastName?: {
    localized: Record<string, string>
    preferredLocale: { language: string; country: string }
  }
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(state?: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI ||
    'http://localhost:3000/api/auth/linkedin/callback'

  if (!clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not configured')
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'w_member_social openid profile email',
    state: state || Math.random().toString(36).substring(2, 15),
  })

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<LinkedInTokenResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI ||
    'http://localhost:3000/api/auth/linkedin/callback'

  if (!clientId || !clientSecret) {
    throw new Error(
      'LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are required'
    )
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `LinkedIn token exchange failed: ${response.status} ${error}`
    )
  }

  return response.json()
}

/**
 * Refresh LinkedIn access token
 */
export async function refreshLinkedInToken(
  refreshToken: string
): Promise<LinkedInTokenResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are required'
    )
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `LinkedIn token refresh failed: ${response.status} ${error}`
    )
  }

  return response.json()
}

/**
 * Get LinkedIn user profile using OpenID Connect userinfo endpoint
 */
export async function getLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  // Use OpenID Connect userinfo endpoint instead of deprecated /me
  const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `Failed to get LinkedIn profile: ${response.status} ${error}`
    )
  }

  const data = await response.json()
  // OpenID Connect userinfo returns sub (subject) as the user ID
  // Format: { sub: "urn:li:person:...", given_name: "...", family_name: "...", email: "..." }
  return {
    id: data.sub || data.id, // sub is the OpenID Connect standard for user ID
    firstName: data.given_name
      ? {
          localized: { en_US: data.given_name },
          preferredLocale: { language: 'en', country: 'US' },
        }
      : undefined,
    lastName: data.family_name
      ? {
          localized: { en_US: data.family_name },
          preferredLocale: { language: 'en', country: 'US' },
        }
      : undefined,
  }
}
