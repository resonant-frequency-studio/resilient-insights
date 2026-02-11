/**
 * LinkedIn API client
 * Handles direct API calls to LinkedIn
 */

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

export interface LinkedInPostOptions {
  text: string
  imageUrl?: string
  visibility?: 'PUBLIC' | 'CONNECTIONS'
}

export interface LinkedInPostResponse {
  id: string
  activity: string
}

/**
 * Publish a text post to LinkedIn
 * If imageUrl is provided, it will publish with image
 */
export async function publishLinkedInPost(
  accessToken: string,
  options: LinkedInPostOptions
): Promise<LinkedInPostResponse> {
  const { text, imageUrl, visibility = 'PUBLIC' } = options

  // If image URL is provided, use image posting
  if (imageUrl) {
    return publishLinkedInPostWithImage(accessToken, { ...options, imageUrl })
  }

  // LinkedIn UGC Post API requires specific format
  // First, we need to get the user's URN
  // Note: LinkedIn API v2 uses different endpoints for profile
  // We'll use the authenticated user's ID from the token
  const profile = await getLinkedInProfile(accessToken)
  // LinkedIn profile ID format: urn:li:person:{id}
  const authorUrn = profile.id?.startsWith('urn:')
    ? profile.id
    : `urn:li:person:${profile.id}`

  // Create UGC post
  const ugcPost = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  }

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(ugcPost),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    activity: data.activity || data.id,
  }
}

/**
 * Register an image upload with LinkedIn
 * Returns upload URL and asset URN
 */
async function registerImageUpload(
  accessToken: string
): Promise<{ uploadUrl: string; asset: string }> {
  const profile = await getLinkedInProfile(accessToken)
  const authorUrn = profile.id?.startsWith('urn:')
    ? profile.id
    : `urn:li:person:${profile.id}`

  const registerRequest = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: authorUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  }

  const response = await fetch(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(registerRequest),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `Failed to register image upload: ${response.status} ${error}`
    )
  }

  const data = await response.json()

  // Parse response structure
  const uploadMechanism =
    data.value?.uploadMechanism?.[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ]
  if (!uploadMechanism?.uploadUrl || !data.value?.asset) {
    throw new Error('Invalid response from LinkedIn upload registration')
  }

  return {
    uploadUrl: uploadMechanism.uploadUrl,
    asset: data.value.asset,
  }
}

/**
 * Upload image binary to LinkedIn
 */
async function uploadImageToLinkedIn(
  uploadUrl: string,
  imageBuffer: ArrayBuffer
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload image: ${response.status} ${error}`)
  }
}

/**
 * Publish a post with image to LinkedIn
 * Steps:
 * 1. Fetch the image from the URL
 * 2. Register the upload with LinkedIn
 * 3. Upload the image binary
 * 4. Create the UGC post with the asset URN
 */
export async function publishLinkedInPostWithImage(
  accessToken: string,
  options: LinkedInPostOptions & { imageUrl: string }
): Promise<LinkedInPostResponse> {
  const { text, imageUrl, visibility = 'PUBLIC' } = options

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

  // Validate image size (LinkedIn limit is typically 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (imageSize > maxSize) {
    throw new Error(
      `Image too large: ${imageSize} bytes. LinkedIn limit is ${maxSize} bytes.`
    )
  }

  // Step 2: Register the upload
  const { uploadUrl, asset } = await registerImageUpload(accessToken)

  // Step 3: Upload the image binary
  await uploadImageToLinkedIn(uploadUrl, imageBuffer)

  // Step 4: Get profile and create UGC post with image
  const profile = await getLinkedInProfile(accessToken)
  const authorUrn = profile.id?.startsWith('urn:')
    ? profile.id
    : `urn:li:person:${profile.id}`

  // Create UGC post with image
  const ugcPost = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text,
        },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            description: {
              text: text.substring(0, 200), // LinkedIn allows description up to 200 chars
            },
            media: asset,
            title: {
              text: text.substring(0, 200), // LinkedIn allows title up to 200 chars
            },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  }

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(ugcPost),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    activity: data.activity || data.id,
  }
}

/**
 * Get LinkedIn user profile using OpenID Connect userinfo endpoint
 */
export async function getLinkedInProfile(accessToken: string) {
  // Use OpenID Connect userinfo endpoint instead of deprecated /me
  const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `Failed to get LinkedIn profile: ${response.status} ${error}`
    )
  }

  const data = await response.json()
  // OpenID Connect userinfo returns sub (subject) as the user ID
  // The sub is typically in format: "urn:li:person:xxxxx" or just the ID
  return {
    id: data.sub || data.id,
  }
}
