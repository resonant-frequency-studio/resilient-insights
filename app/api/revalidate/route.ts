import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { getSanityPostTag, SANITY_POSTS_TAG } from '@/lib/sanity/tags'

type SanityWebhookBody = {
  _type?: string
  slug?: { current?: string } | string
}

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json(
      { message: 'Missing SANITY_REVALIDATE_SECRET' },
      { status: 500 }
    )
  }

  const { isValidSignature, body } = await parseBody<SanityWebhookBody>(
    req,
    secret,
    true
  )

  if (!isValidSignature) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  }

  if (!body?._type) {
    return NextResponse.json(
      { message: 'Missing document type in webhook body' },
      { status: 400 }
    )
  }

  // Home and article pages both depend on this global posts tag.
  if (
    body._type === 'post' ||
    body._type === 'category' ||
    body._type === 'author'
  ) {
    revalidateTag(SANITY_POSTS_TAG, 'max')
    revalidatePath('/')
  }

  if (body._type === 'post') {
    const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current

    if (slug) {
      revalidateTag(getSanityPostTag(slug), 'max')
      revalidatePath(`/${slug}`)
    }
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
