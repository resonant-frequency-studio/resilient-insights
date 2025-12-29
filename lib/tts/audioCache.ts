import { list, put } from '@vercel/blob'
import crypto from 'crypto'

const BLOB_PREFIX = 'tts/'

/**
 * Generates a hash from the body text for cache key generation
 * This ensures cache invalidation only happens when body content changes
 */
export function getBodyTextHash(bodyText: string): string {
  return crypto.createHash('sha256').update(bodyText).digest('hex').slice(0, 16)
}

/**
 * Generates a cache key from slug and body text hash
 * Using body text hash ensures cache only invalidates when actual content changes
 */
export function getCacheKey(slug: string, bodyTextHash: string): string {
  return `${slug}-${bodyTextHash}`
}

/**
 * Generates the Blob storage path for a cache key
 */
export function getBlobPath(cacheKey: string): string {
  return `${BLOB_PREFIX}${cacheKey}.mp3`
}

/**
 * Finds a cached audio URL if it exists in Vercel Blob storage
 * Returns the public URL if found, null otherwise
 */
export async function findCachedUrl(cacheKey: string): Promise<string | null> {
  const path = getBlobPath(cacheKey)

  try {
    // List blobs with the exact path as prefix
    const { blobs } = await list({
      prefix: path,
    })

    // Check if we found a blob with the exact path
    const matchingBlob = blobs.find((blob) => blob.pathname === path)
    if (matchingBlob) {
      return matchingBlob.url
    }
  } catch (error) {
    // If list fails, treat as cache miss
    console.error('[TTS Cache] Error checking cache:', error)
    return null
  }

  return null
}

/**
 * Saves an MP3 buffer to Vercel Blob storage
 * Returns the public URL of the saved blob
 */
export async function saveMp3(cacheKey: string, buffer: Buffer): Promise<string> {
  const path = getBlobPath(cacheKey)

  const blob = await put(path, buffer, {
    contentType: 'audio/mpeg',
    access: 'public',
  })

  return blob.url
}

