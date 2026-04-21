/**
 * Scheduling helpers
 * Functions for scheduling posts via Inngest
 */

import { inngest } from '@/lib/inngest/client'
import { client } from '@/sanity/lib/client'
import {
  findOrCreateDistributionDoc,
  writeClient,
} from '@/lib/sanity/writeClient'

export type Channel = 'linkedin' | 'facebook' | 'instagram'

export interface SchedulePostOptions {
  articleId: string
  channel: Channel
  content: string
  scheduledAt: string // ISO 8601
  imageUrl?: string // Optional image URL for the post
}

/**
 * Schedule a post to be published at a specific time
 */
export async function schedulePost(options: SchedulePostOptions): Promise<{
  success: boolean
  scheduledPostId?: string
  error?: string
}> {
  const { articleId, channel, content, scheduledAt, imageUrl } = options

  try {
    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return {
        success: false,
        error: 'Scheduled time must be in the future',
      }
    }

    // Store scheduled post in postDistribution
    const scheduledPost: Record<string, unknown> = {
      channel,
      content,
      scheduledAt,
      status: 'scheduled',
      ...(imageUrl && { imageUrl }), // Store image URL if provided
    }

    // Find/create distribution doc and append to scheduledPosts array
    const distributionDocId = await findOrCreateDistributionDoc(articleId)
    const distribution = await client.fetch(
      `*[_type == "postDistribution" && _id == $distributionDocId][0]{
        "existingScheduled": scheduledPosts
      }`,
      { distributionDocId }
    )

    const existingScheduled = distribution?.existingScheduled || []
    const updatedScheduled = [...existingScheduled, scheduledPost]

    await writeClient
      .patch(distributionDocId)
      .set({
        scheduledPosts: updatedScheduled,
      })
      .commit()

    // Send event to Inngest
    // Inngest will handle the scheduling based on the scheduledAt time
    await inngest.send({
      name: 'post/scheduled',
      data: {
        articleId,
        distributionDocId,
        channel,
        content,
        scheduledAt,
        scheduledPostIndex: existingScheduled.length, // Index in array for updating
        imageUrl, // Include image URL if provided
      },
    })

    return {
      success: true,
      scheduledPostId: `scheduled-${articleId}-${existingScheduled.length}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
