/**
 * Facebook token management
 * Handles storing and retrieving OAuth tokens from Sanity
 */

import { client } from '@/sanity/lib/client'
import { writeClient } from '@/lib/sanity/writeClient'
import { exchangeForLongLivedToken } from './oauth'

export interface FacebookTokens {
  accessToken: string // Page access token
  userAccessToken?: string // User access token (for getting page token)
  pageId: string
  pageName?: string
  instagramBusinessAccountId?: string // Instagram Business Account ID (if linked)
  expiresAt: string // ISO 8601
  connectedAt: string // ISO 8601
}

/**
 * Get Facebook tokens from Sanity
 * Note: In a real implementation, tokens should be stored per-user or globally,
 * not per-post. For MVP, we'll use a global settings document or environment.
 * This function accepts postId for now but may need refactoring.
 */
export async function getFacebookTokens(
  postId?: string
): Promise<FacebookTokens | null> {
  // For MVP, we'll fetch from any post that has Facebook connected
  // In production, this should be a global settings document
  const query = postId
    ? `*[_type == "post" && _id == $postId][0]{
        "facebook": distribution.socialAccounts.facebook
      }`
    : `*[_type == "post" && defined(distribution.socialAccounts.facebook.accessToken)][0]{
        "facebook": distribution.socialAccounts.facebook
      }`

  const post = await client.fetch(query, postId ? { postId } : {})

  if (!post?.facebook?.accessToken) {
    return null
  }

  return {
    accessToken: post.facebook.accessToken,
    userAccessToken: post.facebook.userAccessToken,
    pageId: post.facebook.pageId,
    pageName: post.facebook.pageName,
    instagramBusinessAccountId: post.facebook.instagramBusinessAccountId,
    expiresAt: post.facebook.expiresAt,
    connectedAt: post.facebook.connectedAt,
  }
}

/**
 * Store Facebook tokens in Sanity
 */
export async function storeFacebookTokens(
  postId: string,
  tokens: FacebookTokens
): Promise<void> {
  await writeClient
    .patch(postId)
    .set({
      'distribution.socialAccounts.facebook': {
        accessToken: tokens.accessToken,
        ...(tokens.userAccessToken && {
          userAccessToken: tokens.userAccessToken,
        }),
        pageId: tokens.pageId,
        ...(tokens.pageName && { pageName: tokens.pageName }),
        ...(tokens.instagramBusinessAccountId && {
          instagramBusinessAccountId: tokens.instagramBusinessAccountId,
        }),
        expiresAt: tokens.expiresAt,
        connectedAt: tokens.connectedAt,
      },
    })
    .commit()
}

/**
 * Get valid page access token, refreshing if necessary
 */
export async function getValidAccessToken(postId: string): Promise<string> {
  const tokens = await getFacebookTokens(postId)

  if (!tokens) {
    throw new Error('Facebook account not connected')
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(tokens.expiresAt)
  const now = new Date()
  const buffer = 5 * 60 * 1000 // 5 minutes

  if (expiresAt.getTime() - now.getTime() < buffer) {
    // Token expired or about to expire, try to refresh
    if (tokens.userAccessToken) {
      try {
        // Exchange user token for long-lived token (this also refreshes page token)
        const refreshed = await exchangeForLongLivedToken(
          tokens.userAccessToken
        )

        // Note: In Facebook, page tokens are long-lived by default if user token is long-lived
        // But we still need to get the page token again via getUserPages
        // For now, we'll note that page tokens don't expire if user token is long-lived
        // In production, you may want to implement proper page token refresh

        // Update expiration (long-lived tokens last 60 days)
        const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)

        const newTokens: FacebookTokens = {
          ...tokens,
          userAccessToken: refreshed.access_token,
          expiresAt: newExpiresAt.toISOString(),
        }

        await storeFacebookTokens(postId, newTokens)
        // Return the page token (which doesn't change, but we've refreshed the user token)
        return tokens.accessToken
      } catch (error) {
        throw new Error(
          `Failed to refresh Facebook token: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    } else {
      // No user token available for refresh
      throw new Error('Facebook token expired and cannot be refreshed')
    }
  }

  return tokens.accessToken
}

/**
 * Get Facebook page ID from stored tokens
 */
export async function getFacebookPageId(
  postId: string
): Promise<string | null> {
  const tokens = await getFacebookTokens(postId)

  if (!tokens) {
    return null
  }

  return tokens.pageId
}

/**
 * Remove Facebook connection
 */
export async function disconnectFacebook(postId: string): Promise<void> {
  await writeClient
    .patch(postId)
    .unset(['distribution.socialAccounts.facebook'])
    .commit()
}
