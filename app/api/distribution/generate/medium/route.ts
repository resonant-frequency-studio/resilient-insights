import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { patchPostDistribution } from '@/lib/sanity/writeClient'
import { generateMedium, RateLimitError } from '@/lib/distribution/generate'
import { plainTextToPortableText } from '@/lib/sanity/portableTextConverter'
import { z } from 'zod'
import { logWarn, logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
  force: z.boolean().optional().default(false),
})

/**
 * Validate authentication header
 */
function validateAuth(request: NextRequest): boolean {
  const secret = process.env.DISTRIBUTION_SECRET
  if (!secret) {
    logWarn('DISTRIBUTION_SECRET is not set')
    return false
  }

  const headerSecret = request.headers.get('X-DISTRIBUTION-SECRET')
  return headerSecret === secret
}

/**
 * POST /api/distribution/generate/medium
 * Generate Medium-ready content using Gemini AI
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
        body,
        categories[]->{title}
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

    const tags =
      post.categories?.map((cat: { title: string }) => cat.title) || []

    const mediumContent = await generateMedium({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body,
      canonicalUrl,
      postId,
      tags,
    })

    const generatedAt = new Date().toISOString()
    const bodyBlocks = plainTextToPortableText(mediumContent.content)

    const mediumData = {
      status: 'ready' as const,
      canonicalUrl,
      body: bodyBlocks,
      title: mediumContent.title,
      subtitle: mediumContent.subtitle || '',
      tags: mediumContent.tags,
      generatedAt,
    }

    await patchPostDistribution(post._id, {
      medium: mediumData,
    })

    return NextResponse.json({
      success: true,
      data: mediumData,
    })
  } catch (error) {
    logError('Medium generation error:', error)

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
