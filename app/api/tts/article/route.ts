import { NextRequest } from 'next/server'
import { client } from '@/sanity/lib/client'
import { postBySlugQuery } from '@/lib/sanity/queries'
import { portableTextToSpeechText } from '@/lib/tts/portableTextToSpeechText'
import {
  getCacheKey,
  getBodyTextHash,
  findCachedUrl,
  saveMp3,
} from '@/lib/tts/audioCache'
import {
  fetchSpeechStream,
  ELEVENLABS_MAX_CHARS,
} from '@/lib/tts/elevenlabs.server'
import { logWarn, logError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const MAX_CHARS = 18_000 // ~12-15 min spoken audio

/** Split text into chunks under maxLen, breaking at paragraph/sentence/word boundaries */
function splitTextIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining)
      break
    }
    const segment = remaining.slice(0, maxLen)
    const lastParagraph = segment.lastIndexOf('\n\n')
    const lastNewline = segment.lastIndexOf('\n')
    const lastSentence = segment.lastIndexOf('. ')
    const lastSpace = segment.lastIndexOf(' ')
    const breakAt =
      lastParagraph >= maxLen * 0.5
        ? lastParagraph + 2
        : lastSentence >= maxLen * 0.5
          ? lastSentence + 2
          : lastNewline >= maxLen * 0.5
            ? lastNewline + 1
            : lastSpace >= 0
              ? lastSpace + 1
              : maxLen
    const chunk = remaining.slice(0, breakAt).trim()
    chunks.push(chunk)
    remaining = remaining.slice(breakAt).trim()
  }
  return chunks
}

type RangeParseResult =
  | { type: 'full' }
  | { type: 'partial'; start: number; end: number }
  | { type: 'invalid' }

function parseRangeHeader(
  rangeHeader: string | null,
  totalLength: number
): RangeParseResult {
  if (!rangeHeader) return { type: 'full' }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
  if (!match) return { type: 'invalid' }

  const [, startStr, endStr] = match
  if (!startStr && !endStr) return { type: 'invalid' }

  let start: number
  let end: number

  if (!startStr) {
    // Suffix range: bytes=-500 (last 500 bytes)
    const suffixLength = parseInt(endStr, 10)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return { type: 'invalid' }
    }
    start = Math.max(totalLength - suffixLength, 0)
    end = totalLength - 1
  } else {
    start = parseInt(startStr, 10)
    end = endStr ? parseInt(endStr, 10) : totalLength - 1
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < 0 ||
    start > end ||
    start >= totalLength
  ) {
    return { type: 'invalid' }
  }

  end = Math.min(end, totalLength - 1)
  return { type: 'partial', start, end }
}

function createAudioResponse(
  mp3Buffer: Buffer,
  cacheControl: string,
  cacheStatus: 'hit' | 'miss',
  rangeHeader: string | null
): Response {
  const totalLength = mp3Buffer.length
  const range = parseRangeHeader(rangeHeader, totalLength)

  if (range.type === 'invalid') {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${totalLength}`,
        'Accept-Ranges': 'bytes',
      },
    })
  }

  if (range.type === 'partial') {
    const chunk = mp3Buffer.subarray(range.start, range.end + 1)
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': cacheControl,
        'X-TTS-Cache': cacheStatus,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${range.start}-${range.end}/${totalLength}`,
        'Content-Length': String(chunk.length),
      },
    })
  }

  return new Response(new Uint8Array(mp3Buffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': cacheControl,
      'X-TTS-Cache': cacheStatus,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(totalLength),
    },
  })
}

/**
 * GET /api/tts/article?slug=...
 * Streams TTS audio for an article, caching MP3 for future requests
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')
  const isMetaRequest = searchParams.get('meta') === '1'
  const rangeHeader = request.headers.get('range')

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Fetch post from Sanity
    const post = await client.fetch(postBySlugQuery, { slug })

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert PortableText to plain text
    const text = portableTextToSpeechText(post.body)

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Article has no text content' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Hard guard: enforce character limit
    if (text.length > MAX_CHARS) {
      return new Response(
        JSON.stringify({ error: 'Article too long for audio playback.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (isMetaRequest) {
      const firstChunkChars = Math.min(text.length, ELEVENLABS_MAX_CHARS)
      const durationScale =
        firstChunkChars > 0 ? text.length / firstChunkChars : 1

      return new Response(
        JSON.stringify({
          textLength: text.length,
          chunkCount: Math.ceil(text.length / ELEVENLABS_MAX_CHARS),
          durationScale,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Build cache key from slug and body text hash
    // Using body text hash ensures cache only invalidates when actual content changes
    const postSlug = post.slug?.current || slug
    const bodyTextHash = getBodyTextHash(text)
    const cacheKey = getCacheKey(postSlug, bodyTextHash)

    // Check cache first (with backward compatibility for old timestamp-based format)
    const cachedUrl = await findCachedUrl(cacheKey, postSlug, post._updatedAt)

    if (cachedUrl) {
      // Cache hit: fetch cached MP3 and serve with byte-range support
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TTS] Cache hit for slug: ${slug}`)
      }

      const cachedResponse = await fetch(cachedUrl)
      if (!cachedResponse.ok) {
        // If cached URL fails, fall through to generate new audio
        logWarn(`[TTS] Failed to fetch cached audio, generating new`)
      } else {
        const cachedArrayBuffer = await cachedResponse.arrayBuffer()
        const cachedMp3 = Buffer.from(cachedArrayBuffer)
        return createAudioResponse(
          cachedMp3,
          'public, max-age=31536000, immutable',
          'hit',
          rangeHeader
        )
      }
    }

    // Cache miss: fetch from ElevenLabs and stream while caching
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TTS] Cache miss for slug: ${slug}, generating audio`)
    }

    const textChunks =
      text.length > ELEVENLABS_MAX_CHARS
        ? splitTextIntoChunks(text, ELEVENLABS_MAX_CHARS)
        : [text]

    if (process.env.NODE_ENV === 'development' && textChunks.length > 1) {
      console.log(
        `[TTS] Splitting into ${textChunks.length} chunks for ElevenLabs`
      )
    }

    const audioBuffers: Buffer[] = []
    for (let i = 0; i < textChunks.length; i++) {
      const res = await fetchSpeechStream(textChunks[i])
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate audio' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      const body = res.body
      if (!body) {
        return new Response(
          JSON.stringify({ error: 'No response body from ElevenLabs' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      const reader = body.getReader()
      const parts: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value)
      }
      audioBuffers.push(Buffer.concat(parts.map(p => Buffer.from(p))))
    }

    const mp3Buffer = Buffer.concat(audioBuffers)

    // Cache in background
    saveMp3(cacheKey, mp3Buffer)
      .then(url => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[TTS] Cached audio for slug: ${slug} at ${url}`)
        }
      })
      .catch(error => {
        logError(`[TTS] Failed to cache audio for slug: ${slug}`, error)
      })

    return createAudioResponse(mp3Buffer, 'no-store', 'miss', rangeHeader)
  } catch (error) {
    logError('[TTS] Error in API route:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
