/**
 * Instagram Graph API client
 * Handles direct API calls to Instagram Graph API
 * Note: Instagram Graph API uses the same base URL as Facebook Graph API
 */

const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'
const INSTAGRAM_GRAPH_API_BASE = 'https://graph.instagram.com/v18.0'

export interface InstagramPostOptions {
  caption: string
  imageUrl: string // Required for Instagram
  hashtags?: string[]
}

export interface InstagramPostResponse {
  id: string
}

export interface InstagramMediaContainer {
  id: string
  status_code?: string
}

/**
 * Get Instagram Business Account ID from a Facebook Page
 * The Instagram account must be linked to the Facebook Page
 */
export async function getInstagramBusinessAccount(
  pageAccessToken: string,
  pageId: string
): Promise<string> {
  const response = await fetch(
    `${FACEBOOK_GRAPH_API_BASE}/${pageId}?fields=instagram_business_account{id}&access_token=${pageAccessToken}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message ||
      `Failed to get Instagram Business Account: ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()

  // Handle nested structure: instagram_business_account.id
  const igAccount = data.instagram_business_account

  if (!igAccount) {
    throw new Error(
      'Instagram Business Account not found. Ensure your Instagram account is linked to this Facebook Page.'
    )
  }

  // Handle both nested and direct id access
  const igAccountId = igAccount.id || igAccount

  if (!igAccountId) {
    throw new Error(
      'Instagram Business Account not found. Ensure your Instagram account is linked to this Facebook Page.'
    )
  }

  return igAccountId
}

/**
 * Create a media container for an Instagram post
 * This is step 1 of the two-step publishing process
 */
async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  options: InstagramPostOptions
): Promise<InstagramMediaContainer> {
  const { caption, imageUrl, hashtags = [] } = options

  // Build caption with hashtags
  let fullCaption = caption
  if (hashtags.length > 0) {
    const hashtagString = hashtags.map(tag => `#${tag}`).join(' ')
    fullCaption = `${caption}\n\n${hashtagString}`
  }

  // Validate caption length (Instagram limit is 2,200 characters)
  if (fullCaption.length > 2200) {
    throw new Error(
      `Caption too long (${fullCaption.length} chars). Instagram limit is 2,200 characters.`
    )
  }

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API_BASE}/${igUserId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: fullCaption,
        access_token: accessToken,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message ||
      `Failed to create media container: ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return {
    id: data.id,
    status_code: data.status_code,
  }
}

/**
 * Check media container status
 * Containers can be in various states: IN_PROGRESS, FINISHED, ERROR, etc.
 */
async function checkMediaContainerStatus(
  containerId: string,
  accessToken: string
): Promise<string> {
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message ||
      `Failed to check container status: ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.status_code || 'UNKNOWN'
}

/**
 * Publish a media container to Instagram
 * This is step 2 of the two-step publishing process
 */
async function publishMediaContainer(
  igUserId: string,
  containerId: string,
  accessToken: string
): Promise<InstagramPostResponse> {
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API_BASE}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    const errorMessage =
      error.error?.message || `Failed to publish: ${response.status}`
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return {
    id: data.id,
  }
}

/**
 * Publish a post to Instagram
 * Instagram requires an image, so imageUrl is mandatory
 *
 * Process:
 * 1. Get Instagram Business Account ID from Facebook Page
 * 2. Create media container with image and caption
 * 3. Wait for container to be ready (status_code: FINISHED)
 * 4. Publish the container
 */
export async function publishInstagramPost(
  pageAccessToken: string,
  pageId: string,
  options: InstagramPostOptions
): Promise<InstagramPostResponse> {
  const { imageUrl } = options

  if (!imageUrl) {
    throw new Error('imageUrl is required for Instagram posts')
  }

  // Step 1: Get Instagram Business Account ID
  const igUserId = await getInstagramBusinessAccount(pageAccessToken, pageId)

  // Step 2: Create media container
  const container = await createMediaContainer(
    igUserId,
    pageAccessToken,
    options
  )

  // Step 3: Wait for container to be ready (poll if needed)
  // Instagram processes the image, so we may need to wait
  let status = container.status_code || 'IN_PROGRESS'
  let attempts = 0
  const maxAttempts = 10 // Poll up to 10 times
  const pollInterval = 2000 // 2 seconds between polls

  while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))
    status = await checkMediaContainerStatus(container.id, pageAccessToken)
    attempts++

    if (status === 'ERROR') {
      throw new Error('Media container processing failed')
    }
  }

  if (status !== 'FINISHED') {
    throw new Error(
      `Media container not ready. Status: ${status}. Container may have expired.`
    )
  }

  // Step 4: Publish the container
  return await publishMediaContainer(igUserId, container.id, pageAccessToken)
}
