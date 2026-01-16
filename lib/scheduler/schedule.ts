/**
 * Scheduling helpers
 * Functions for scheduling posts via Inngest
 */

import { inngest } from '@/lib/inngest/client'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/lib/sanity/writeClient'

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

    // Store scheduled post in Sanity
    const scheduledPost: Record<string, unknown> = {
      channel,
      content,
      scheduledAt,
      status: 'scheduled',
      ...(imageUrl && { imageUrl }), // Store image URL if provided
    }

    // Add to scheduledPosts array
    const post = await client.fetch(
      `*[_type == "post" && _id == $articleId][0]{
        "existingScheduled": distribution.scheduledPosts
      }`,
      { articleId }
    )

    const existingScheduled = post?.existingScheduled || []
    const updatedScheduled = [...existingScheduled, scheduledPost]

    await writeClient
      .patch(articleId)
      .set({
        'distribution.scheduledPosts': updatedScheduled,
      })
      .commit()

    // Send event to Inngest
    // Inngest will handle the scheduling based on the scheduledAt time
    await inngest.send({
      name: 'post/scheduled',
      data: {
        articleId,
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

/**
 * Cancel a scheduled post
 */
export async function cancelScheduledPost(
  articleId: string,
  scheduledPostIndex: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const post = await client.fetch(
      `*[_type == "post" && _id == $articleId][0]{
        "scheduledPosts": distribution.scheduledPosts
      }`,
      { articleId }
    )

    if (!post?.scheduledPosts || !post.scheduledPosts[scheduledPostIndex]) {
      return {
        success: false,
        error: 'Scheduled post not found',
      }
    }

    // Remove the scheduled post from array
    const updatedScheduled = post.scheduledPosts.filter(
      (_: unknown, index: number) => index !== scheduledPostIndex
    )

    await writeClient
      .patch(articleId)
      .set({
        'distribution.scheduledPosts': updatedScheduled,
      })
      .commit()

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all scheduled posts for an article
 */
export async function getScheduledPosts(articleId: string) {
  const post = await client.fetch(
    `*[_type == "post" && _id == $articleId][0]{
      "scheduledPosts": distribution.scheduledPosts
    }`,
    { articleId }
  )

  return post?.scheduledPosts || []
}
