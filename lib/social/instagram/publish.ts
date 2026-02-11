/**
 * Instagram publishing logic
 * High-level functions for publishing posts to Instagram
 */

import { getValidAccessToken, getFacebookPageId } from '../facebook/tokens'
import { publishInstagramPost, InstagramPostOptions } from './api'

export interface PublishInstagramOptions {
  postId: string
  caption: string
  imageUrl: string // Required for Instagram
  hashtags?: string[]
}

export interface PublishInstagramResult {
  success: boolean
  postId?: string
  error?: string
}

/**
 * Publish content to Instagram Business Account
 * Handles token refresh automatically
 * Note: Instagram requires an image, so imageUrl is mandatory
 */
export async function publishToInstagram(
  options: PublishInstagramOptions
): Promise<PublishInstagramResult> {
  const { postId, caption, imageUrl, hashtags } = options

  try {
    // Get valid page access token (refreshes if needed)
    // Instagram uses the same Facebook Page access token
    const pageAccessToken = await getValidAccessToken(postId)

    // Get page ID (Instagram Business Account is linked to Facebook Page)
    const pageId = await getFacebookPageId(postId)

    if (!pageId) {
      return {
        success: false,
        error: 'Facebook page ID not found',
      }
    }

    // Validate caption length (Instagram limit is 2,200 characters)
    // Note: Hashtags will be appended, so we check the full length
    const hashtagString =
      hashtags && hashtags.length > 0
        ? '\n\n' + hashtags.map(tag => `#${tag}`).join(' ')
        : ''
    const fullCaption = caption + hashtagString

    if (fullCaption.length > 2200) {
      return {
        success: false,
        error: `Caption too long (${fullCaption.length} chars). Instagram limit is 2,200 characters including hashtags.`,
      }
    }

    // Validate image URL is provided (required for Instagram)
    if (!imageUrl) {
      return {
        success: false,
        error: 'Image URL is required for Instagram posts',
      }
    }

    // Publish post
    const postOptions: InstagramPostOptions = {
      caption,
      imageUrl,
      ...(hashtags && hashtags.length > 0 && { hashtags }),
    }

    const result = await publishInstagramPost(
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
