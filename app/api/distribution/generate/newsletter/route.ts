import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { generateNewsletter } from '@/lib/distribution/generate'
import { patchPostDistribution } from '@/lib/sanity/writeClient'
import { plainTextToPortableText } from '@/lib/sanity/portableTextConverter'
import { z } from 'zod'

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
    console.warn('DISTRIBUTION_SECRET is not set')
    return false
  }

  const headerSecret = request.headers.get('X-DISTRIBUTION-SECRET')
  return headerSecret === secret
}

/**
 * POST /api/distribution/generate/newsletter
 * Generate newsletter content using Gemini AI
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

    const newsletter = await generateNewsletter({
      title: post.title,
      excerpt: post.excerpt || '',
      body: post.body,
      canonicalUrl,
      postId,
    })

    const generatedAt = new Date().toISOString()
    const newsletterData = {
      ...newsletter,
      body: plainTextToPortableText(newsletter.body),
      generatedAt,
      model: 'gemini-2.5-flash',
    }

    await patchPostDistribution(post._id, {
      publishedUrl: canonicalUrl,
      distribution: {
        newsletter: newsletterData,
      },
    })

    return NextResponse.json({
      success: true,
      generated: {
        newsletter: newsletterData,
      },
      canonicalUrl,
    })
  } catch (error) {
    console.error('Newsletter generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Newsletter generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
