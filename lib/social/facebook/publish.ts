/**
 * Facebook publishing logic
 * High-level functions for publishing posts to Facebook
 */

import { getValidAccessToken, getFacebookPageId } from './tokens'
import { publishFacebookPost, FacebookPostOptions } from './api'

export interface PublishFacebookOptions {
  postId: string
  content: string
  imageUrl?: string
}

export interface PublishFacebookResult {
  success: boolean
  postId?: string
  error?: string
}

/**
 * Publish content to Facebook Page
 * Handles token refresh automatically
 * Note: postId is used to find tokens, but tokens are stored per-post in MVP
 */
export async function publishToFacebook(
  options: PublishFacebookOptions
): Promise<PublishFacebookResult> {
  const { postId, content, imageUrl } = options

  try {
    // Get valid page access token (refreshes if needed)
    const pageAccessToken = await getValidAccessToken(postId)

    // Get page ID
    const pageId = await getFacebookPageId(postId)

    if (!pageId) {
      return {
        success: false,
        error: 'Facebook page ID not found',
      }
    }

    // Validate content length (Facebook limit is 63,206 characters)
    if (content.length > 63206) {
      return {
        success: false,
        error: `Content too long (${content.length} chars). Facebook limit is 63,206 characters.`,
      }
    }

    // Publish post
    const postOptions: FacebookPostOptions = {
      message: content,
      ...(imageUrl && { imageUrl }),
    }

    const result = await publishFacebookPost(
      pageAccessToken,
      pageId,
      postOptions
    )

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
