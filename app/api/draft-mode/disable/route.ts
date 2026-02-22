import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSafeRedirectPath(pathname: string | null): string {
  if (!pathname || !pathname.startsWith('/')) {
    return '/'
  }
  return pathname
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirectPath = getSafeRedirectPath(
    searchParams.get('sanity-preview-pathname') || searchParams.get('slug')
  )
  const draft = await draftMode()

  draft.disable()

  return NextResponse.redirect(new URL(redirectPath, request.url))
}
