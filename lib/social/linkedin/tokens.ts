/**
 * LinkedIn token management
 * Handles storing and retrieving OAuth tokens from Sanity
 */

import { client } from '@/sanity/lib/client'
import { writeClient } from '@/lib/sanity/writeClient'
import { refreshLinkedInToken } from './oauth'

export interface LinkedInTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string // ISO 8601
  profileId: string
  connectedAt: string // ISO 8601
}

/**
 * Get LinkedIn tokens from Sanity
 * Note: In a real implementation, tokens should be stored per-user or globally,
 * not per-post. For MVP, we'll use a global settings document or environment.
 * This function accepts postId for now but may need refactoring.
 */
export async function getLinkedInTokens(
  postId?: string
): Promise<LinkedInTokens | null> {
  // For MVP, we'll fetch from any post that has LinkedIn connected
  // In production, this should be a global settings document
  const query = postId
    ? `*[_type == "post" && _id == $postId][0]{
        "linkedin": distribution.socialAccounts.linkedin
      }`
    : `*[_type == "post" && defined(distribution.socialAccounts.linkedin.accessToken)][0]{
        "linkedin": distribution.socialAccounts.linkedin
      }`

  const post = await client.fetch(query, postId ? { postId } : {})

  if (!post?.linkedin?.accessToken) {
    return null
  }

  return {
    accessToken: post.linkedin.accessToken,
    refreshToken: post.linkedin.refreshToken,
    expiresAt: post.linkedin.expiresAt,
    profileId: post.linkedin.profileId,
    connectedAt: post.linkedin.connectedAt,
  }
}

/**
 * Store LinkedIn tokens in Sanity
 */
export async function storeLinkedInTokens(
  postId: string,
  tokens: LinkedInTokens
): Promise<void> {
  await writeClient
    .patch(postId)
    .set({
      'distribution.socialAccounts.linkedin': {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        profileId: tokens.profileId,
        connectedAt: tokens.connectedAt,
      },
    })
    .commit()
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(postId: string): Promise<string> {
  const tokens = await getLinkedInTokens(postId)

  if (!tokens) {
    throw new Error('LinkedIn account not connected')
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(tokens.expiresAt)
  const now = new Date()
  const buffer = 5 * 60 * 1000 // 5 minutes

  if (expiresAt.getTime() - now.getTime() < buffer) {
    // Token expired or about to expire, refresh it
    try {
      const refreshed = await refreshLinkedInToken(tokens.refreshToken)
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)

      const newTokens: LinkedInTokens = {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token || tokens.refreshToken, // LinkedIn may not return refresh token
        expiresAt: newExpiresAt.toISOString(),
        profileId: tokens.profileId,
        connectedAt: tokens.connectedAt,
      }

      await storeLinkedInTokens(postId, newTokens)
      return newTokens.accessToken
    } catch (error) {
      throw new Error(
        `Failed to refresh LinkedIn token: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return tokens.accessToken
}

/**
 * Remove LinkedIn connection
 */
export async function disconnectLinkedIn(postId: string): Promise<void> {
  await writeClient
    .patch(postId)
    .unset(['distribution.socialAccounts.linkedin'])
    .commit()
}
