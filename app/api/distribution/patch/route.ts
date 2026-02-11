import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeClient } from '@/lib/sanity/writeClient'
import { logError, logWarn } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  // Either postId (to find the distribution doc) or distributionDocId (direct)
  postId: z.string().min(1).optional(),
  distributionDocId: z.string().min(1).optional(),
  path: z.array(z.string()).min(1),
  value: z.unknown(),
})

// Fields that are allowed to be patched on postDistribution documents
const allowedRootPaths = new Set([
  'newsletter',
  'social',
  'medium',
  'scheduledPosts',
  'socialAccounts',
])
const segmentPattern = /^[a-zA-Z0-9_]+$/

function validateAuth(request: NextRequest): boolean {
  const secret = process.env.DISTRIBUTION_SECRET
  if (!secret) {
    logWarn('DISTRIBUTION_SECRET is not set')
    return false
  }

  const headerSecret = request.headers.get('X-DISTRIBUTION-SECRET')
  return headerSecret === secret
}

function isPathAllowed(path: string[]): boolean {
  if (path.length === 0) return false
  if (!allowedRootPaths.has(path[0])) return false
  return path.every(segment => segmentPattern.test(segment))
}

async function findDistributionDocId(postId: string): Promise<string | null> {
  const cleanPostId = postId.replace(/^drafts\./, '')
  const result = await writeClient.fetch<{ _id: string } | null>(
    `*[_type == "postDistribution" && post._ref == $postId][0]{_id}`,
    { postId: cleanPostId }
  )
  return result?._id || null
}

export async function POST(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { postId, distributionDocId, path, value } = RequestSchema.parse(body)

    // Must have either postId or distributionDocId
    if (!postId && !distributionDocId) {
      return NextResponse.json(
        { error: 'Either postId or distributionDocId is required' },
        { status: 400 }
      )
    }

    if (!isPathAllowed(path)) {
      return NextResponse.json({ error: 'Invalid patch path' }, { status: 400 })
    }

    // Find the distribution document ID
    let docId: string | undefined = distributionDocId
    if (!docId && postId) {
      const foundId = await findDistributionDocId(postId)
      if (!foundId) {
        return NextResponse.json(
          { error: 'No distribution document found for this post' },
          { status: 404 }
        )
      }
      docId = foundId
    }

    const patchPath = path.join('.')

    await writeClient
      .patch(docId!)
      .set({ [patchPath]: value })
      .commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    logError('Distribution patch error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update distribution content' },
      { status: 500 }
    )
  }
}
