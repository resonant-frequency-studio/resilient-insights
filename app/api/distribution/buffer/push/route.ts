import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { patchPostDistribution } from '@/lib/sanity/writeClient'
import { z } from 'zod'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  postId: z.string(),
  schedule: z.enum(['draft']).optional().default('draft'),
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
 * Create a Buffer draft
 */
async function createBufferDraft(
  profileId: string,
  text: string,
  accessToken: string
): Promise<string> {
  const response = await fetch(
    'https://api.buffer.com/v1/updates/create.json',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        profile_ids: [profileId],
        text,
        now: false, // Create as draft
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Buffer API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.updates?.[0]?.id || ''
}

/**
 * POST /api/distribution/buffer/push
 *
 * @deprecated This endpoint is deprecated. Use /api/distribution/generate-and-schedule instead,
 * which integrates with Make.com for Buffer scheduling.
 *
 * Push social media drafts to Buffer (direct API - no longer supported by Buffer)
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = process.env.BUFFER_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json(
      { error: 'BUFFER_ACCESS_TOKEN is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { postId } = RequestSchema.parse(body)

    // Fetch post with distribution data
    const post = await client.fetch(
      `*[_type == "post" && _id == $postId][0]{
        _id,
        "distribution": distribution,
        "publishedUrl": $baseUrl + "/" + slug.current
      }`,
      {
        postId,
        baseUrl:
          process.env.SITE_BASE_URL ||
          'https://articles.resilientleadership.us',
      }
    )

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!post.distribution?.social) {
      return NextResponse.json(
        {
          error:
            'Social content not generated. Please generate social drafts first.',
        },
        { status: 400 }
      )
    }

    const social = post.distribution.social
    const draftIds: {
      linkedin?: string
      facebook?: string
      instagram?: string
    } = {}
    const errors: string[] = []

    // Push LinkedIn
    if (social.linkedin) {
      const linkedinProfileId = process.env.BUFFER_LINKEDIN_PROFILE_ID
      if (linkedinProfileId) {
        try {
          const draftId = await createBufferDraft(
            linkedinProfileId,
            social.linkedin as string,
            accessToken
          )
          draftIds.linkedin = draftId
        } catch (error) {
          errors.push(
            `LinkedIn: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    }

    // Push Facebook
    if (social.facebook) {
      const facebookProfileId = process.env.BUFFER_FACEBOOK_PROFILE_ID
      if (facebookProfileId) {
        try {
          const draftId = await createBufferDraft(
            facebookProfileId,
            social.facebook as string,
            accessToken
          )
          draftIds.facebook = draftId
        } catch (error) {
          errors.push(
            `Facebook: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    }

    // Push Instagram
    if (social.instagramCaption) {
      const instagramProfileId = process.env.BUFFER_INSTAGRAM_PROFILE_ID
      if (instagramProfileId) {
        try {
          // Instagram posts in Buffer: caption + hashtags (if supported)
          let instagramText = social.instagramCaption as string
          if (
            social.instagramHashtags &&
            Array.isArray(social.instagramHashtags)
          ) {
            const hashtags = (social.instagramHashtags as string[]).join(' ')
            instagramText = `${instagramText}\n\n${hashtags}`
          }

          const draftId = await createBufferDraft(
            instagramProfileId,
            instagramText,
            accessToken
          )
          draftIds.instagram = draftId
        } catch (error) {
          errors.push(
            `Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    }

    // Update Sanity
    const bufferStatus = errors.length > 0 ? 'error' : 'pushed'
    await patchPostDistribution(postId, {
      distribution: {
        buffer: {
          status: bufferStatus,
          lastPushedAt: new Date().toISOString(),
          draftIds,
          ...(errors.length > 0 && { error: errors.join('; ') }),
        },
      },
    })

    return NextResponse.json({
      success: true,
      draftIds,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    console.error('Buffer push error:', error)
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
