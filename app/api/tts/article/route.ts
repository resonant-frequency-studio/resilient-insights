import { NextRequest } from 'next/server'
import { client } from '@/sanity/lib/client'
import { postBySlugQuery } from '@/lib/sanity/queries'
import { portableTextToSpeechText } from '@/lib/tts/portableTextToSpeechText'
import { getCacheKey, getBodyTextHash, findCachedUrl, saveMp3 } from '@/lib/tts/audioCache'
import { fetchSpeechStream } from '@/lib/tts/elevenlabs.server'

export const runtime = 'nodejs'

const MAX_CHARS = 12_000 // ~8-10 min spoken audio

/**
 * GET /api/tts/article?slug=...
 * Streams TTS audio for an article, caching MP3 for future requests
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')

  if (!slug) {
    return new Response(
      JSON.stringify({ error: 'Missing slug parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Fetch post from Sanity
    const post = await client.fetch(postBySlugQuery, { slug })

    if (!post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert PortableText to plain text
    const text = portableTextToSpeechText(post.body)

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Article has no text content' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Hard guard: enforce character limit
    if (text.length > MAX_CHARS) {
      return new Response(
        JSON.stringify({ error: 'Article too long for audio playback.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build cache key from slug and body text hash
    // Using body text hash ensures cache only invalidates when actual content changes
    const postSlug = post.slug?.current || slug
    const bodyTextHash = getBodyTextHash(text)
    const cacheKey = getCacheKey(postSlug, bodyTextHash)

    // Check cache first
    const cachedUrl = await findCachedUrl(cacheKey)

    if (cachedUrl) {
      // Cache hit: fetch and stream the cached MP3
      console.log(`[TTS] Cache hit for slug: ${slug}`)
      
      const cachedResponse = await fetch(cachedUrl)
      if (!cachedResponse.ok) {
        // If cached URL fails, fall through to generate new audio
        console.warn(`[TTS] Failed to fetch cached audio, generating new`)
      } else {
        // Stream the cached MP3
        const cachedBody = cachedResponse.body
        return new Response(cachedBody, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-TTS-Cache': 'hit',
          },
        })
      }
    }

    // Cache miss: fetch from ElevenLabs and stream while caching
    console.log(`[TTS] Cache miss for slug: ${slug}, generating audio`)

    const elevenLabsResponse = await fetchSpeechStream(text)

    if (!elevenLabsResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate audio' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a readable stream for the client
    const reader = elevenLabsResponse.body?.getReader()
    if (!reader) {
      return new Response(
        JSON.stringify({ error: 'No response body from ElevenLabs' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a transform stream that tees the data
    const stream = new ReadableStream({
      async start(controller) {
        const chunks: Uint8Array[] = []

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Write chunk to client stream immediately
            controller.enqueue(value)

            // Also accumulate for caching
            chunks.push(value)
          }

          // Close the client stream
          controller.close()

          // Cache the complete audio in the background
          // (don't await to avoid blocking the response)
          const mp3Buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
          saveMp3(cacheKey, mp3Buffer)
            .then((url) => {
              console.log(`[TTS] Cached audio for slug: ${slug} at ${url}`)
            })
            .catch((error) => {
              console.error(`[TTS] Failed to cache audio for slug: ${slug}`, error)
            })
        } catch (error) {
          console.error('[TTS] Error streaming audio:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'X-TTS-Cache': 'miss',
      },
    })
  } catch (error) {
    console.error('[TTS] Error in API route:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

