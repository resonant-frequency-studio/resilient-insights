import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import {
  generateNewsletter,
  generateSocial,
  RateLimitError,
} from '@/lib/distribution/generate'
import { patchPostDistribution } from '@/lib/sanity/writeClient'
import { z } from 'zod'
import { logWarn, logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
  targets: z.array(z.enum(['newsletter', 'social'])),
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
 * POST /api/distribution/generate
 * Generate newsletter and/or social media content using Gemini
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { postId, targets } = RequestSchema.parse(body)

    // Fetch post from Sanity by _id
    const post = await client.fetch(
      `*[_type == "post" && _id == $postId][0]{
        _id,
        title,
        slug,
        excerpt,
        body,
        mainImage
      }`,
      { postId }
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

    const generated: {
      newsletter?: unknown
      social?: unknown
    } = {}

    // Generate newsletter if requested
    if (targets.includes('newsletter')) {
      try {
        const newsletter = await generateNewsletter({
          title: post.title,
          excerpt: post.excerpt || '',
          body: post.body,
          canonicalUrl,
          postId,
        })

        generated.newsletter = {
          ...newsletter,
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        }
      } catch (error) {
        logError('Newsletter generation error:', error)
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
        return NextResponse.json(
          {
            error:
              'Newsletter generation failed. Please try again in a moment.',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Generate social if requested
    if (targets.includes('social')) {
      try {
        const social = await generateSocial({
          title: post.title,
          excerpt: post.excerpt || '',
          body: post.body,
          canonicalUrl,
          postId,
        })

        generated.social = {
          ...social,
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        }
      } catch (error) {
        logError('Social generation error:', error)
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
        return NextResponse.json(
          {
            error: 'Social generation failed. Please try again in a moment.',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Save to Sanity
    try {
      const distribution: Record<string, unknown> = {}
      if (generated.newsletter) {
        distribution.newsletter = generated.newsletter
      }
      if (generated.social) {
        distribution.social = generated.social
      }

      await patchPostDistribution(postId, {
        publishedUrl: canonicalUrl,
        distribution,
      })
    } catch (error) {
      logError('Error saving to Sanity:', error)
      return NextResponse.json(
        {
          error: 'Failed to save generated content',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generated,
      canonicalUrl,
    })
  } catch (error) {
    logError('Generate endpoint error:', error)
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
    return NextResponse.json(
      {
        error: 'Generation failed. Please try again in a moment.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
