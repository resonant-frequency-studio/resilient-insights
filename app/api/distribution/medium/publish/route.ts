import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { patchPostDistribution } from '@/lib/sanity/writeClient'
import { generateMedium } from '@/lib/distribution/generate'
import { plainTextToPortableText } from '@/lib/sanity/portableTextConverter'
import { z } from 'zod'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
})

/**
 * Validate authentication header
 * Supports Bearer token or X-DISTRIBUTION-SECRET header
 */
function validateAuth(request: NextRequest): boolean {
  const secret = process.env.DISTRIBUTION_SECRET
  if (!secret) {
    console.warn('DISTRIBUTION_SECRET is not set')
    return false
  }

  // Check Bearer token first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return token === secret
  }

  // Fallback to X-DISTRIBUTION-SECRET header
  const headerSecret = request.headers.get('X-DISTRIBUTION-SECRET')
  return headerSecret === secret
}

/**
 * POST /api/distribution/medium/publish
 * Generate Medium-ready content using Gemini AI
 * Content is formatted for copy/paste into Medium's post editor
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { postId } = RequestSchema.parse(body)

    // Handle draft IDs - strip 'drafts.' prefix if present for querying
    const basePostId = postId.replace(/^drafts\./, '')

    // Fetch post with categories for tags (check both draft and published versions)
    const post = await client.fetch(
      `*[_type == "post" && (_id == $postId || _id == $basePostId || _id == "drafts." + $basePostId)][0]{
        _id,
        title,
        slug,
        excerpt,
        body,
        categories[]->{title},
        "publishedUrl": $baseUrl + "/" + slug.current
      }`,
      {
        postId,
        basePostId,
        baseUrl:
          process.env.SITE_BASE_URL ||
          'https://articles.resilientleadership.us',
      }
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

    const canonicalUrl =
      post.publishedUrl ||
      `${process.env.SITE_BASE_URL || 'https://articles.resilientleadership.us'}/${post.slug.current}`

    // Get tags from categories
    const tags =
      post.categories?.map((cat: { title: string }) => cat.title) || []

    // Generate Medium-ready content with Gemini
    const mediumContent = await generateMedium({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body,
      canonicalUrl,
      postId,
      tags,
    })

    // Save to Sanity (use actual document ID from query result)
    // Convert content to Portable Text blocks
    const bodyBlocks = plainTextToPortableText(mediumContent.content)
    const generatedAt = new Date().toISOString()

    await patchPostDistribution(post._id, {
      distribution: {
        medium: {
          status: 'ready',
          canonicalUrl,
          body: bodyBlocks,
          title: mediumContent.title,
          subtitle: mediumContent.subtitle || '',
          tags: mediumContent.tags,
          generatedAt,
        },
      },
    })

    return NextResponse.json({
      success: true,
      status: 'ready',
      message:
        'Medium-ready content generated. Copy and paste into Medium editor.',
      data: {
        title: mediumContent.title,
        subtitle: mediumContent.subtitle || '',
        body: bodyBlocks,
        tags: mediumContent.tags,
        generatedAt,
      },
    })
  } catch (error) {
    console.error('Medium generation error:', error)

    // Save error to Sanity
    try {
      const body = await request.json()
      const { postId } = RequestSchema.parse(body)
      await patchPostDistribution(postId, {
        distribution: {
          medium: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      })
    } catch {
      // Ignore errors saving error state
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
