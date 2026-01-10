import { NextRequest, NextResponse } from 'next/server'
import { PortableTextBlock } from '@sanity/types'
import { client } from '@/sanity/lib/client'
import {
  generateNewsletter,
  generateSocial,
  generateLinkedIn,
  generateFacebook,
  generateInstagram,
} from '@/lib/distribution/generate'
import {
  patchPostDistribution,
  patchSocialPlatform,
} from '@/lib/sanity/writeClient'
import { plainTextToPortableText } from '@/lib/sanity/portableTextConverter'
import { z } from 'zod'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
  targets: z.array(
    z.enum(['newsletter', 'social', 'linkedin', 'facebook', 'instagram'])
  ),
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

    // Handle draft IDs - strip 'drafts.' prefix if present for querying
    const basePostId = postId.replace(/^drafts\./, '')

    // Fetch post from Sanity by _id (check both draft and published versions)
    const post = await client.fetch(
      `*[_type == "post" && (_id == $postId || _id == $basePostId || _id == "drafts." + $basePostId)][0]{
        _id,
        title,
        slug,
        excerpt,
        body,
        mainImage
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

    const generated: {
      newsletter?: unknown
      social?: {
        linkedin?: { text: PortableTextBlock[] }
        facebook?: { text: PortableTextBlock[] }
        instagram?: { caption: PortableTextBlock[]; hashtags: string[] }
        suggestedFirstComment?: string
        generatedAt?: string
        model?: string
      }
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
          // Convert body text to Portable Text blocks
          body: plainTextToPortableText(newsletter.body),
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        }
      } catch (error) {
        console.error('Newsletter generation error:', error)
        return NextResponse.json(
          {
            error: 'Newsletter generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Generate all social platforms if 'social' target is requested
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
          linkedin: {
            ...social.linkedin,
            text: plainTextToPortableText(social.linkedin.text),
          },
          facebook: {
            ...social.facebook,
            text: plainTextToPortableText(social.facebook.text),
          },
          instagram: {
            ...social.instagram,
            caption: plainTextToPortableText(social.instagram.caption),
          },
          suggestedFirstComment: social.suggestedFirstComment,
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        }
      } catch (error) {
        console.error('Social generation error:', error)
        return NextResponse.json(
          {
            error: 'Social generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Generate LinkedIn only if requested (and not already generated via 'social')
    // Uses granular patching to preserve other platform data
    if (targets.includes('linkedin') && !targets.includes('social')) {
      try {
        const linkedin = await generateLinkedIn({
          title: post.title,
          excerpt: post.excerpt || '',
          body: post.body,
          canonicalUrl,
          postId,
        })

        // Convert text to Portable Text
        const linkedinData = {
          text: plainTextToPortableText(linkedin.text),
        }

        // Patch only LinkedIn data (preserves Facebook, Instagram, etc.)
        await patchSocialPlatform(post._id, 'linkedin', linkedinData, {
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        })

        generated.social = { linkedin: linkedinData }
      } catch (error) {
        console.error('LinkedIn generation error:', error)
        return NextResponse.json(
          {
            error: 'LinkedIn generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Generate Facebook only if requested (and not already generated via 'social')
    // Uses granular patching to preserve other platform data
    if (targets.includes('facebook') && !targets.includes('social')) {
      try {
        const facebook = await generateFacebook({
          title: post.title,
          excerpt: post.excerpt || '',
          body: post.body,
          canonicalUrl,
          postId,
        })

        // Convert text to Portable Text
        const facebookData = {
          text: plainTextToPortableText(facebook.text),
        }

        // Patch only Facebook data (preserves LinkedIn, Instagram, etc.)
        await patchSocialPlatform(post._id, 'facebook', facebookData, {
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        })

        generated.social = { ...generated.social, facebook: facebookData }
      } catch (error) {
        console.error('Facebook generation error:', error)
        return NextResponse.json(
          {
            error: 'Facebook generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Generate Instagram only if requested (and not already generated via 'social')
    // Uses granular patching to preserve other platform data
    if (targets.includes('instagram') && !targets.includes('social')) {
      try {
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

        // Patch only Instagram data (preserves LinkedIn, Facebook, etc.)
        await patchSocialPlatform(post._id, 'instagram', instagramData, {
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash',
          suggestedFirstComment: instagram.suggestedFirstComment,
        })

        generated.social = {
          ...generated.social,
          instagram: instagramData,
          suggestedFirstComment: instagram.suggestedFirstComment,
        }
      } catch (error) {
        console.error('Instagram generation error:', error)
        return NextResponse.json(
          {
            error: 'Instagram generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Save newsletter and bulk social to Sanity (for 'newsletter' and 'social' targets)
    // Individual platform targets are already saved above via patchSocialPlatform
    try {
      const distribution: Record<string, unknown> = {}
      if (generated.newsletter) {
        distribution.newsletter = generated.newsletter
      }
      // Only save bulk social if 'social' target was requested (all platforms at once)
      if (targets.includes('social') && generated.social) {
        distribution.social = generated.social
      }

      // Only call patchPostDistribution if there's something to save
      if (Object.keys(distribution).length > 0) {
        await patchPostDistribution(post._id, {
          publishedUrl: canonicalUrl,
          distribution,
        })
      }
    } catch (error) {
      console.error('Error saving to Sanity:', error)
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
    console.error('Generate endpoint error:', error)
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
