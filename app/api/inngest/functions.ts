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
      // Fetch post to verify it exists
      const post = await client.fetch(
        `*[_type == "post" && _id == $articleId][0]{
          "scheduledPosts": distribution.scheduledPosts
        }`,
        { articleId }
      )

      if (!post) {
        throw new Error(`Post ${articleId} not found`)
      }

      const scheduledPost = post.scheduledPosts?.[scheduledPostIndex]
      if (!scheduledPost || scheduledPost.status !== 'scheduled') {
        throw new Error('Scheduled post not found or already processed')
      }

      // Publish based on channel
      let result
      if (channel === 'linkedin') {
        result = await publishToLinkedIn({
          postId: articleId,
          content,
          imageUrl: scheduledPost.imageUrl || imageUrl, // Use imageUrl from scheduledPost or event
        })
      } else if (channel === 'facebook') {
        result = await publishToFacebook({
          postId: articleId,
          content,
          imageUrl: scheduledPost.imageUrl || imageUrl, // Use imageUrl from scheduledPost or event
        })
      } else if (channel === 'instagram') {
        // Instagram requires caption, hashtags, and imageUrl
        // The content field contains the caption
        // Hashtags and imageUrl come from scheduledPost or event
        result = await publishToInstagram({
          postId: articleId,
          caption: content,
          imageUrl: scheduledPost.imageUrl || imageUrl || '', // Instagram requires image
          hashtags: scheduledPost.hashtags || [],
        })
      } else {
        throw new Error(`Channel ${channel} not yet implemented`)
      }

      // Update status in Sanity
      if (result.success) {
        const updatedScheduled = [...(post.scheduledPosts || [])]
        updatedScheduled[scheduledPostIndex] = {
          ...scheduledPost,
          status: 'published',
          platformPostId: result.postId,
          publishedAt: new Date().toISOString(),
        }

        await writeClient
          .patch(articleId)
          .set({
            'distribution.scheduledPosts': updatedScheduled,
          })
          .commit()
      } else {
        // Mark as failed
        const updatedScheduled = [...(post.scheduledPosts || [])]
        updatedScheduled[scheduledPostIndex] = {
          ...scheduledPost,
          status: 'failed',
          error: result.error,
        }

        await writeClient
          .patch(articleId)
          .set({
            'distribution.scheduledPosts': updatedScheduled,
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

      // Query Sanity for posts with scheduled posts ready to publish
      const posts = await client.fetch(
        `*[_type == "post" && 
          defined(distribution.scheduledPosts) &&
          count(distribution.scheduledPosts[status == "scheduled" && scheduledAt <= $now]) > 0
        ]{
          _id,
          "scheduledPosts": distribution.scheduledPosts[status == "scheduled" && scheduledAt <= $now]
        }`,
        { now }
      )

      // Send events for each ready post
      const events = []
      for (const post of posts) {
        for (let i = 0; i < post.scheduledPosts.length; i++) {
          const scheduled = post.scheduledPosts[i]
          events.push({
            name: 'post/scheduled',
            data: {
              articleId: post._id,
              channel: scheduled.channel,
              content: scheduled.content,
              scheduledAt: scheduled.scheduledAt,
              scheduledPostIndex: i,
              imageUrl: scheduled.imageUrl, // Include image URL if present
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
