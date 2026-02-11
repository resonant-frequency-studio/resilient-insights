/**
 * Inngest functions for scheduled post publishing
 */

import { inngest } from '@/lib/inngest/client'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/lib/sanity/writeClient'
import { publishToLinkedIn } from '@/lib/social/linkedin/publish'
import { publishToFacebook } from '@/lib/social/facebook/publish'
import { publishToInstagram } from '@/lib/social/instagram/publish'

/**
 * Function to publish a scheduled post
 * Triggered by 'post/scheduled' event
 * Uses step.sleep to wait until scheduled time
 */
export const publishScheduledPost = inngest.createFunction(
  { id: 'publish-scheduled-post' },
  { event: 'post/scheduled' },
  async ({ event, step }) => {
    const {
      articleId,
      distributionDocId,
      channel,
      content,
      scheduledPostIndex,
      scheduledAt,
      imageUrl,
    } = event.data

    // Wait until scheduled time
    const scheduledDate = new Date(scheduledAt)
    const now = Date.now()
    const waitMs = scheduledDate.getTime() - now

    if (waitMs > 0) {
      await step.sleep('wait-for-scheduled-time', waitMs)
    }

    return await step.run('publish-post', async () => {
      // Fetch the postDistribution document to get current scheduledPosts
      const distribution = await client.fetch(
        `*[_type == "postDistribution" && _id == $distributionDocId][0]{
          _id,
          scheduledPosts
        }`,
        { distributionDocId }
      )

      if (!distribution) {
        throw new Error(`Distribution document ${distributionDocId} not found`)
      }

      const scheduledPost = distribution.scheduledPosts?.[scheduledPostIndex]
      if (!scheduledPost || scheduledPost.status !== 'scheduled') {
        throw new Error('Scheduled post not found or already processed')
      }

      // Publish based on channel
      let result
      if (channel === 'linkedin') {
        result = await publishToLinkedIn({
          postId: articleId,
          content,
          imageUrl: scheduledPost.imageUrl || imageUrl,
        })
      } else if (channel === 'facebook') {
        result = await publishToFacebook({
          postId: articleId,
          content,
          imageUrl: scheduledPost.imageUrl || imageUrl,
        })
      } else if (channel === 'instagram') {
        result = await publishToInstagram({
          postId: articleId,
          caption: content,
          imageUrl: scheduledPost.imageUrl || imageUrl || '',
          hashtags: scheduledPost.hashtags || [],
        })
      } else {
        throw new Error(`Channel ${channel} not yet implemented`)
      }

      // Update status in Sanity on the postDistribution document
      if (result.success) {
        const updatedScheduled = [...(distribution.scheduledPosts || [])]
        updatedScheduled[scheduledPostIndex] = {
          ...scheduledPost,
          status: 'published',
          platformPostId: result.postId,
          publishedAt: new Date().toISOString(),
        }

        await writeClient
          .patch(distributionDocId)
          .set({
            scheduledPosts: updatedScheduled,
          })
          .commit()
      } else {
        // Mark as failed
        const updatedScheduled = [...(distribution.scheduledPosts || [])]
        updatedScheduled[scheduledPostIndex] = {
          ...scheduledPost,
          status: 'failed',
          error: result.error,
        }

        await writeClient
          .patch(distributionDocId)
          .set({
            scheduledPosts: updatedScheduled,
          })
          .commit()

        throw new Error(result.error || 'Publishing failed')
      }

      return {
        success: true,
        postId: result.postId,
      }
    })
  }
)

/**
 * Cron job to check for scheduled posts ready to publish
 * Runs every minute
 */
export const checkScheduledPosts = inngest.createFunction(
  { id: 'check-scheduled-posts' },
  { cron: '*/1 * * * *' }, // Every minute
  async ({ step }) => {
    return await step.run('find-ready-posts', async () => {
      const now = new Date().toISOString()

      // Query Sanity for postDistribution documents with scheduled posts ready to publish
      const distributions = await client.fetch(
        `*[_type == "postDistribution" && 
          defined(scheduledPosts) &&
          count(scheduledPosts[status == "scheduled" && scheduledAt <= $now]) > 0
        ]{
          _id,
          "postId": post._ref,
          "scheduledPosts": scheduledPosts[status == "scheduled" && scheduledAt <= $now]
        }`,
        { now }
      )

      // Send events for each ready post
      const events = []
      for (const distribution of distributions) {
        for (let i = 0; i < distribution.scheduledPosts.length; i++) {
          const scheduled = distribution.scheduledPosts[i]
          events.push({
            name: 'post/scheduled',
            data: {
              articleId: distribution.postId,
              distributionDocId: distribution._id,
              channel: scheduled.channel,
              content: scheduled.content,
              scheduledAt: scheduled.scheduledAt,
              scheduledPostIndex: i,
              imageUrl: scheduled.imageUrl,
            },
          })
        }
      }

      if (events.length > 0) {
        await inngest.send(events)
      }

      return {
        found: events.length,
        events,
      }
    })
  }
)
