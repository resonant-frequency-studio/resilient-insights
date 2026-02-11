/**
 * Facebook Graph API client
 * Handles direct API calls to Facebook Graph API
 */

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0'

export interface FacebookPostOptions {
  message: string
  imageUrl?: string
}

export interface FacebookPostResponse {
  id: string
}

/**
 * Publish a text post to Facebook Page
 * If imageUrl is provided, it will publish with image
 */
export async function publishFacebookPost(
  pageAccessToken: string,
  pageId: string,
  options: FacebookPostOptions
): Promise<FacebookPostResponse> {
  const { message, imageUrl } = options

  // If image URL is provided, use image posting
  if (imageUrl) {
    return publishFacebookPostWithImage(pageAccessToken, pageId, {
      ...options,
      imageUrl,
    })
  }

  // Post text-only content to page feed
  const response = await fetch(`${FACEBOOK_API_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      access_token: pageAccessToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message || `Facebook API error: ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return {
    id: data.id,
  }
}

/**
 * Publish a post with image to Facebook Page
 * Steps:
 * 1. Fetch the image from the URL
 * 2. Upload image to Facebook via /photos endpoint
 * 3. Get the photo ID from response
 * 4. Create a feed post with attached_media pointing to the photo
 */
export async function publishFacebookPostWithImage(
  pageAccessToken: string,
  pageId: string,
  options: FacebookPostOptions & { imageUrl: string }
): Promise<FacebookPostResponse> {
  const { message, imageUrl } = options

  if (!imageUrl) {
    throw new Error('imageUrl is required for image posts')
  }

  // Step 1: Fetch the image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to fetch image from ${imageUrl}: ${imageResponse.status}`
    )
  }

  const imageBuffer = await imageResponse.arrayBuffer()
  const imageSize = imageBuffer.byteLength

  // Validate image size (Facebook limit is 4MB for photos)
  const maxSize = 4 * 1024 * 1024 // 4MB
  if (imageSize > maxSize) {
    throw new Error(
      `Image too large: ${imageSize} bytes. Facebook limit is ${maxSize} bytes.`
    )
  }

  // Step 2: Upload image to Facebook via /photos endpoint
  // Convert ArrayBuffer to Blob for FormData
  const imageBlob = new Blob([imageBuffer])
  const formData = new FormData()
  formData.append('source', imageBlob)
  formData.append('published', 'false') // Don't publish the photo directly
  if (message) {
    formData.append('message', message)
  }

  const photoResponse = await fetch(
    `${FACEBOOK_API_BASE}/${pageId}/photos?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!photoResponse.ok) {
    const error = await photoResponse.json()
    const errorMessage =
      error.error?.message || `Failed to upload image: ${photoResponse.status}`
    throw new Error(errorMessage)
  }

  const photoData = await photoResponse.json()
  const photoId = photoData.id

  if (!photoId) {
    throw new Error('Failed to get photo ID from Facebook response')
  }

  // Step 3: Create feed post with attached_media
  const feedResponse = await fetch(`${FACEBOOK_API_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      attached_media: [
        {
          media_fbid: photoId,
        },
      ],
      access_token: pageAccessToken,
    }),
  })

  if (!feedResponse.ok) {
    const error = await feedResponse.json()
    const errorMessage =
      error.error?.message || `Facebook API error: ${feedResponse.status}`
    throw new Error(errorMessage)
  }

  const feedData = await feedResponse.json()
  return {
    id: feedData.id,
  }
}

/**
 * Get Facebook Page information
 * Requires page access token
 */
export async function getFacebookPage(pageAccessToken: string) {
  const response = await fetch(
    `${FACEBOOK_API_BASE}/me?fields=id,name&access_token=${pageAccessToken}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message || `Failed to get Facebook page: ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return {
    id: data.id,
    name: data.name,
  }
}
