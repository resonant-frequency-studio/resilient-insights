import { list, put } from '@vercel/blob'

const BLOB_PREFIX = 'tts/'

/**
 * Generates a cache key from slug and updatedAt timestamp
 */
export function getCacheKey(slug: string, updatedAt: string): string {
  return `${slug}-${updatedAt}`
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

