import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const writeToken = process.env.SANITY_WRITE_TOKEN

if (!writeToken) {
  console.warn(
    'SANITY_WRITE_TOKEN is not set. Distribution features requiring writes will not work.'
  )
}

/**
 * Server-side Sanity client with write permissions
 * Used for updating post documents with generated distribution content
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: writeToken,
  useCdn: false, // Always use fresh data for writes
})

/**
 * Patch a post document's distribution fields
 * @param postId - The Sanity document ID of the post
 * @param patchObject - Object with distribution fields to update
 */
export async function patchPostDistribution(
  postId: string,
  patchObject: {
    distribution?: {
      newsletter?: Record<string, unknown>
      social?: Record<string, unknown>
      buffer?: Record<string, unknown>
      medium?: Record<string, unknown>
    }
    publishedUrl?: string
  }
): Promise<void> {
  if (!writeToken) {
    throw new Error('SANITY_WRITE_TOKEN is required for distribution updates')
  }

  try {
    // Build the patch object
    const patch = writeClient.patch(postId)

    if (patchObject.publishedUrl) {
      patch.set({ publishedUrl: patchObject.publishedUrl })
    }

    if (patchObject.distribution) {
      if (patchObject.distribution.newsletter) {
        patch.set({
          'distribution.newsletter': patchObject.distribution.newsletter,
        })
      }
      if (patchObject.distribution.social) {
        patch.set({
          'distribution.social': patchObject.distribution.social,
        })
      }
      if (patchObject.distribution.buffer) {
        patch.set({
          'distribution.buffer': patchObject.distribution.buffer,
        })
      }
      if (patchObject.distribution.medium) {
        patch.set({
          'distribution.medium': patchObject.distribution.medium,
        })
      }
    }

    await patch.commit()
  } catch (error) {
    console.error('Error patching post distribution:', error)
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
    const patch = writeClient.patch(postId)

    // Set only the specific platform field
    patch.set({ [`distribution.social.${platform}`]: data })

    // Update metadata if provided
    if (metadata?.generatedAt) {
      patch.set({ 'distribution.social.generatedAt': metadata.generatedAt })
    }
    if (metadata?.model) {
      patch.set({ 'distribution.social.model': metadata.model })
    }
    if (metadata?.suggestedFirstComment !== undefined) {
      patch.set({
        'distribution.social.suggestedFirstComment':
          metadata.suggestedFirstComment,
      })
    }

    await patch.commit()
  } catch (error) {
    console.error(`Error patching ${platform} distribution:`, error)
    throw error
  }
}
