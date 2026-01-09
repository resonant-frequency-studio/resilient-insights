/**
 * Shared server module for distribution logic
 * Pure business logic - no HTTP concerns
 * Can be used by API routes or Server Actions
 */

import { client } from '@/sanity/lib/client'
import { generateSocial } from './generate'
import { patchPostDistribution } from '@/lib/sanity/writeClient'
import { schedulePost } from '@/lib/scheduler/schedule'

export interface RunDistributionOptions {
  articleId: string
  channels: ('linkedin' | 'facebook' | 'instagram')[]
  publishAt?: string // ISO 8601 date string
  force?: boolean // Force regeneration even if already scheduled
}

export interface RunDistributionResult {
  success: boolean
  scheduledPostIds?: string[]
  previews: {
    linkedin?: string
    facebook?: string
    instagram?: {
      caption: string
      hashtags: string[]
      suggestedFirstComment?: string
    }
  }
  error?: string
}

/**
 * Main orchestration function for distribution
 * Fetches article, generates content with Gemini, optionally schedules posts
 */
export async function runDistribution(
  options: RunDistributionOptions
): Promise<RunDistributionResult> {
  const { articleId, channels, publishAt, force = false } = options

  try {
    // Check idempotency (unless force is true)
    if (!force && publishAt) {
      const existing = await client.fetch(
        `*[_type == "post" && _id == $articleId][0]{
          "scheduledPosts": distribution.scheduledPosts
        }`,
        { articleId }
      )

      // Check if there are already scheduled posts for these channels
      const hasScheduled = existing?.scheduledPosts?.some(
        (post: { channel: string; status: string }) =>
          channels.includes(
            post.channel as 'linkedin' | 'facebook' | 'instagram'
          ) && post.status === 'scheduled'
      )

      if (hasScheduled) {
        return {
          success: false,
          error:
            'Content already scheduled for these channels. Use force=true to regenerate.',
          previews: {},
        }
      }
    }

    // Fetch article from Sanity
    const post = await client.fetch(
      `*[_type == "post" && _id == $articleId][0]{
        _id,
        title,
        slug,
        excerpt,
        body,
        mainImage,
        "publishedUrl": $baseUrl + "/" + slug.current
      }`,
      {
        articleId,
        baseUrl:
          process.env.SITE_BASE_URL ||
          'https://articles.resilientleadership.us',
      }
    )

    if (!post) {
      return {
        success: false,
        error: 'Post not found',
        previews: {},
      }
    }

    if (!post.slug?.current) {
      return {
        success: false,
        error: 'Post slug is missing',
        previews: {},
      }
    }

    const canonicalUrl =
      post.publishedUrl ||
      `${process.env.SITE_BASE_URL || 'https://articles.resilientleadership.us'}/${post.slug.current}`

    // Generate social content with Gemini
    const socialContent = await generateSocial({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body,
      canonicalUrl,
      postId: articleId,
    })

    // Build previews object
    const previews: RunDistributionResult['previews'] = {}
    if (channels.includes('linkedin') && socialContent.linkedin) {
      previews.linkedin = socialContent.linkedin.text
    }
    if (channels.includes('facebook') && socialContent.facebook) {
      previews.facebook = socialContent.facebook.text
    }
    if (channels.includes('instagram') && socialContent.instagram) {
      previews.instagram = {
        caption: socialContent.instagram.caption,
        hashtags: socialContent.instagram.hashtags,
        suggestedFirstComment: socialContent.suggestedFirstComment,
      }
    }

    // Save generated content to Sanity
    await patchPostDistribution(articleId, {
      distribution: {
        social: {
          ...(socialContent.linkedin && { linkedin: socialContent.linkedin }),
          ...(socialContent.facebook && { facebook: socialContent.facebook }),
          ...(socialContent.instagram && {
            instagram: socialContent.instagram,
            ...(socialContent.suggestedFirstComment && {
              suggestedFirstComment: socialContent.suggestedFirstComment,
            }),
          }),
          generatedAt: new Date().toISOString(),
        },
      },
    })

    // If publishAt is provided, schedule the posts
    const scheduledPostIds: string[] = []
    if (publishAt) {
      for (const channel of channels) {
        let content: string | undefined
        if (channel === 'linkedin' && socialContent.linkedin) {
          content = socialContent.linkedin.text
        } else if (channel === 'facebook' && socialContent.facebook) {
          content = socialContent.facebook.text
        } else if (channel === 'instagram' && socialContent.instagram) {
          content = socialContent.instagram.caption
        }

        if (content) {
          const scheduleResult = await schedulePost({
            articleId,
            channel,
            content,
            scheduledAt: publishAt,
          })

          if (scheduleResult.success && scheduleResult.scheduledPostId) {
            scheduledPostIds.push(scheduleResult.scheduledPostId)
          }
        }
      }
    }

    return {
      success: true,
      ...(scheduledPostIds.length > 0 && { scheduledPostIds }),
      previews,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      previews: {},
    }
  }
}
