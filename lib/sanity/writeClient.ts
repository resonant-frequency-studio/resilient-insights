import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { logWarn, logError } from '@/lib/utils/logger'

const writeToken = process.env.SANITY_WRITE_TOKEN

if (!writeToken) {
  logWarn(
    'SANITY_WRITE_TOKEN is not set. Distribution features requiring writes will not work.'
  )
}

/**
 * Server-side Sanity client with write permissions
 * Used for updating documents with generated distribution content
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: writeToken,
  useCdn: false, // Always use fresh data for writes
})

/**
 * Find or create a postDistribution document for a given post
 * @param postId - The Sanity document ID of the post
 * @returns The ID of the postDistribution document
 */
export async function findOrCreateDistributionDoc(
  postId: string
): Promise<string> {
  if (!writeToken) {
    throw new Error('SANITY_WRITE_TOKEN is required for distribution updates')
  }

  // Clean the post ID (remove drafts prefix)
  const cleanPostId = postId.replace(/^drafts\./, '')

  // Check if a postDistribution document already exists
  const existing = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "postDistribution" && post._ref == $postId][0]{_id}`,
    { postId: cleanPostId }
  )

  if (existing) {
    return existing._id
  }

  // Create a new postDistribution document
  const newDoc = await writeClient.create({
    _type: 'postDistribution',
    post: {
      _type: 'reference',
      _ref: cleanPostId,
    },
  })

  return newDoc._id
}

/**
 * Patch a postDistribution document's fields
 * @param postId - The Sanity document ID of the post (will find the distribution doc)
 * @param patchObject - Object with fields to update
 */
export async function patchPostDistribution(
  postId: string,
  patchObject: {
    newsletter?: Record<string, unknown>
    social?: Record<string, unknown>
    buffer?: Record<string, unknown>
    medium?: Record<string, unknown>
    scheduledPosts?: Array<Record<string, unknown>>
    socialAccounts?: Record<string, unknown>
  }
): Promise<void> {
  if (!writeToken) {
    throw new Error('SANITY_WRITE_TOKEN is required for distribution updates')
  }

  try {
    // Find or create the distribution document
    const distributionDocId = await findOrCreateDistributionDoc(postId)

    // Build the patch object
    const patch = writeClient.patch(distributionDocId)

    if (patchObject.newsletter) {
      patch.set({ newsletter: patchObject.newsletter })
    }
    if (patchObject.social) {
      patch.set({ social: patchObject.social })
    }
    if (patchObject.buffer) {
      patch.set({ buffer: patchObject.buffer })
    }
    if (patchObject.medium) {
      patch.set({ medium: patchObject.medium })
    }
    if (patchObject.scheduledPosts) {
      patch.set({ scheduledPosts: patchObject.scheduledPosts })
    }
    if (patchObject.socialAccounts) {
      patch.set({ socialAccounts: patchObject.socialAccounts })
    }

    await patch.commit()
  } catch (error) {
    logError('Error patching post distribution:', error)
    throw error
  }
}

/**
 * Patch only a specific social platform's distribution fields
 * This preserves other platform data when generating individual platforms
 */
export async function patchSocialPlatform(
  postId: string,
  platform: 'linkedin' | 'facebook' | 'instagram',
  data: Record<string, unknown>,
  metadata?: {
    generatedAt?: string
    model?: string
    suggestedFirstComment?: string
  }
): Promise<void> {
  if (!writeToken) {
    throw new Error('SANITY_WRITE_TOKEN is required for distribution updates')
  }

  try {
    // Find or create the distribution document
    const distributionDocId = await findOrCreateDistributionDoc(postId)

    const patch = writeClient.patch(distributionDocId)

    // Set only the specific platform field
    patch.set({ [`social.${platform}`]: data })

    // Update metadata if provided
    if (metadata?.generatedAt) {
      patch.set({ 'social.generatedAt': metadata.generatedAt })
    }
    if (metadata?.model) {
      patch.set({ 'social.model': metadata.model })
    }
    if (metadata?.suggestedFirstComment !== undefined) {
      patch.set({
        'social.suggestedFirstComment': metadata.suggestedFirstComment,
      })
    }

    await patch.commit()
  } catch (error) {
    logError(`Error patching ${platform} distribution:`, error)
    throw error
  }
}
