/**
 * Instagram token management
 * Instagram uses the same Facebook Page access tokens
 * This module provides Instagram-specific token helpers
 */

import { getValidAccessToken, getFacebookPageId } from '../facebook/tokens'
import { getInstagramBusinessAccount } from './api'

/**
 * Get Instagram Business Account ID
 * Instagram Business Account is linked to the Facebook Page
 * We use the same Page access token as Facebook
 */
export async function getInstagramBusinessAccountId(
  postId: string
): Promise<string | null> {
  try {
    const pageAccessToken = await getValidAccessToken(postId)
    const pageId = await getFacebookPageId(postId)

    if (!pageId) {
      return null
    }

    const igAccountId = await getInstagramBusinessAccount(
      pageAccessToken,
      pageId
    )

    return igAccountId
  } catch {
    return null
  }
}

/**
 * Get valid access token for Instagram
 * Instagram uses the same Facebook Page access token
 */
export async function getValidInstagramAccessToken(
  postId: string
): Promise<string> {
  // Instagram uses the same Facebook Page access token
  return getValidAccessToken(postId)
}
