import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { generateInstagram, RateLimitError } from '@/lib/distribution/generate'
import { patchSocialPlatform } from '@/lib/sanity/writeClient'
import { plainTextToPortableText } from '@/lib/sanity/portableTextConverter'
import { z } from 'zod'
import { validateAuth } from '@/lib/auth/validateDistribution'
import { logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
  force: z.boolean().optional().default(false),
})

/**
 * POST /api/distribution/generate/instagram
 * Generate Instagram post content using Gemini AI
 */
export async function POST(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { postId } = RequestSchema.parse(body)

    const basePostId = postId.replace(/^drafts\./, '')

    const post = await client.fetch(
      `*[_type == "post" && (_id == $postId || _id == $basePostId || _id == "drafts." + $basePostId)][0]{
        _id,
        title,
        slug,
        excerpt,
        body
      }`,
      { postId, basePostId }
    )

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!post.slug?.current) {
      return NextResponse.json(
        { error: 'Post slug is missing' },
        { status: 400 }
      )
    }

    const canonicalUrl = `${process.env.SITE_BASE_URL || 'https://articles.resilientleadership.us'}/${post.slug.current}`

    const instagram = await generateInstagram({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body,
      canonicalUrl,
      postId,
    })

    const instagramData = {
      caption: plainTextToPortableText(instagram.caption),
      hashtags: instagram.hashtags,
    }

    await patchSocialPlatform(post._id, 'instagram', instagramData, {
      generatedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash',
      suggestedFirstComment: instagram.suggestedFirstComment,
    })

    return NextResponse.json({
      success: true,
      generated: {
        social: {
          instagram: instagramData,
          suggestedFirstComment: instagram.suggestedFirstComment,
        },
      },
    })
  } catch (error) {
    logError('Instagram generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request. Please check your post content.',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          rateLimitRemainingMs: error.remainingMs,
          rateLimitType: error.contentType,
        },
        { status: 429 }
      )
    }

    // Handle specific error types with better messages
    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('missing')
      ) {
        return NextResponse.json(
          {
            error:
              'Post information is missing. Please refresh the page and try again.',
          },
          { status: 404 }
        )
      }

      if (
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        return NextResponse.json(
          {
            error:
              'Unable to connect. Please check your connection and try again.',
          },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Generation failed. Please try again in a moment.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
