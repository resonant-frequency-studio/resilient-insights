/**
 * Action handlers for Distribution panel
 * These functions call the Next.js API routes
 */

const API_BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000'
const DISTRIBUTION_SECRET = process.env.NEXT_PUBLIC_DISTRIBUTION_SECRET || ''

/**
 * Get the distribution secret from environment or prompt
 * In production, this should come from environment variable
 */
function getDistributionSecret(): string {
  // In Studio, we need to pass this from the server
  // For now, we'll use a client-side approach (not ideal for security)
  // Better: Store in Sanity settings document or use Studio's built-in auth
  return DISTRIBUTION_SECRET || ''
}

/**
 * Call API with authentication
 * Returns the raw API response directly (no extra wrapping)
 */
async function callAPI<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T & { success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DISTRIBUTION-SECRET': getDistributionSecret(),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      } as T & { success: boolean; error?: string }
    }

    // Return the raw API response directly
    return data as T & { success: boolean; error?: string }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    } as T & { success: boolean; error?: string }
  }
}

/**
 * Generate newsletter and/or social content
 */
export async function generateContent(
  postId: string,
  targets: ('newsletter' | 'social')[],
  force = false
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/generate', {
    postId,
    targets,
    force,
  })
}

/**
 * Generate LinkedIn draft only
 */
export async function generateLinkedInDraft(
  postId: string,
  force = false
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/generate', {
    postId,
    targets: ['linkedin'],
    force,
  })
}

/**
 * Generate Facebook draft only
 */
export async function generateFacebookDraft(
  postId: string,
  force = false
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/generate', {
    postId,
    targets: ['facebook'],
    force,
  })
}

/**
 * Generate Instagram draft only
 */
export async function generateInstagramDraft(
  postId: string,
  force = false
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/generate', {
    postId,
    targets: ['instagram'],
    force,
  })
}

/**
 * Generate and schedule distribution content via Make.com
 */
export async function generateAndSchedule(
  articleId: string,
  channels: ('linkedin' | 'facebook' | 'instagram')[],
  publishAt?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/generate-and-schedule', {
    articleId,
    channels,
    publishAt,
  })
}

/**
 * Publish to Medium
 */
export async function publishToMedium(
  postId: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/medium/publish', {
    postId,
  })
}

/**
 * Schedule a post to be published at a specific time
 */
export async function schedulePost(
  articleId: string,
  channel: 'linkedin' | 'facebook' | 'instagram',
  content: string,
  scheduledAt: string,
  imageUrl?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return callAPI('/api/distribution/schedule', {
    articleId,
    channel,
    content,
    scheduledAt,
    imageUrl,
  })
}

/**
 * Get recommended posting times
 */
export async function getRecommendations(
  channel: 'linkedin' | 'facebook' | 'instagram',
  date: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const API_BASE_URL =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'
  const DISTRIBUTION_SECRET = process.env.NEXT_PUBLIC_DISTRIBUTION_SECRET || ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/distribution/recommendations?channel=${channel}&date=${date}`,
      {
        headers: {
          'X-DISTRIBUTION-SECRET': DISTRIBUTION_SECRET,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Connect LinkedIn account (initiate OAuth)
 */
export async function connectLinkedIn(
  postId: string,
  returnUrl?: string
): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  const API_BASE_URL =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'

  try {
    // Use current window location as returnUrl if not provided
    const finalReturnUrl =
      returnUrl ||
      (typeof window !== 'undefined' ? window.location.href : undefined)

    const params = new URLSearchParams({
      postId,
      ...(finalReturnUrl && { returnUrl: finalReturnUrl }),
    })

    const response = await fetch(
      `${API_BASE_URL}/api/auth/linkedin?${params.toString()}`
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      authUrl: data.authUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Disconnect LinkedIn account
 */
export async function disconnectLinkedIn(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  return callAPI('/api/auth/linkedin/disconnect', {
    postId,
  })
}
