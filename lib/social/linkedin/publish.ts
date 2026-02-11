/**
 * LinkedIn publishing logic
 * High-level functions for publishing posts to LinkedIn
 */

import { getValidAccessToken } from './tokens'
import { publishLinkedInPost, LinkedInPostOptions } from './api'

export interface PublishLinkedInOptions {
  postId: string
  content: string
  imageUrl?: string
}

export interface PublishLinkedInResult {
  success: boolean
  postId?: string
  error?: string
}

/**
 * Publish content to LinkedIn
 * Handles token refresh automatically
 * Note: postId is used to find tokens, but tokens are stored per-post in MVP
 */
export async function publishToLinkedIn(
  options: PublishLinkedInOptions
): Promise<PublishLinkedInResult> {
  const { postId, content, imageUrl } = options

  try {
    // Get valid access token (refreshes if needed)
    // Pass postId to find tokens, or null to find from any post
    const accessToken = await getValidAccessToken(postId)

    // Validate content length (LinkedIn limit is 3000 characters)
    if (content.length > 3000) {
      return {
        success: false,
        error: `Content too long (${content.length} chars). LinkedIn limit is 3000 characters.`,
      }
    }

    // Publish post
    const postOptions: LinkedInPostOptions = {
      text: content,
      ...(imageUrl && { imageUrl }),
    }

    const result = await publishLinkedInPost(accessToken, postOptions)

    return {
      success: true,
      postId: result.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
