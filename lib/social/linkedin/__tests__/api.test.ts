/**
 * Tests for LinkedIn API client
 * All LinkedIn API calls are mocked to prevent real API requests
 */

import {
  publishLinkedInPost,
  publishLinkedInPostWithImage,
  getLinkedInProfile,
} from '../api'

// Mock global fetch
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('LinkedIn API Client', () => {
  const mockAccessToken = 'test-access-token'
  const mockProfileId = 'urn:li:person:12345'
  const mockPostId = 'urn:li:ugcPost:67890'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getLinkedInProfile', () => {
    it('returns profile with URN format ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'urn:li:person:12345',
        }),
      } as Response)

      const profile = await getLinkedInProfile(mockAccessToken)

      expect(profile.id).toBe('urn:li:person:12345')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )
    })

    it('returns profile with non-URN ID and converts it', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: '12345',
        }),
      } as Response)

      const profile = await getLinkedInProfile(mockAccessToken)

      expect(profile.id).toBe('12345')
    })

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response)

      await expect(getLinkedInProfile(mockAccessToken)).rejects.toThrow(
        'Failed to get LinkedIn profile: 401 Unauthorized'
      )
    })
  })

  describe('publishLinkedInPost', () => {
    it('publishes text-only post successfully', async () => {
      const postText = 'Test LinkedIn post content'

      // Mock profile fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: mockProfileId,
        }),
      } as Response)

      // Mock post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
          activity: mockPostId,
        }),
      } as Response)

      const result = await publishLinkedInPost(mockAccessToken, {
        text: postText,
      })

      expect(result.id).toBe(mockPostId)
      expect(result.activity).toBe(mockPostId)

      // Verify the UGC post payload
      const postCall = mockFetch.mock.calls[1]
      expect(postCall[0]).toBe('https://api.linkedin.com/v2/ugcPosts')
      expect(postCall[1]?.method).toBe('POST')
      expect(postCall[1]?.headers).toEqual({
        Authorization: `Bearer ${mockAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      })

      const body = JSON.parse(postCall[1]?.body as string)
      expect(body.author).toBe(mockProfileId)
      expect(body.lifecycleState).toBe('PUBLISHED')
      expect(
        body.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary
          .text
      ).toBe(postText)
      expect(
        body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory
      ).toBe('NONE')
      expect(body.visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe(
        'PUBLIC'
      )
    })

    it('publishes post with CONNECTIONS visibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockPostId, activity: mockPostId }),
      } as Response)

      await publishLinkedInPost(mockAccessToken, {
        text: 'Test post',
        visibility: 'CONNECTIONS',
      })

      const body = JSON.parse(mockFetch.mock.calls[1][1]?.body as string)
      expect(body.visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe(
        'CONNECTIONS'
      )
    })

    it('delegates to publishLinkedInPostWithImage when imageUrl is provided', async () => {
      const imageUrl = 'https://example.com/image.jpg'
      const mockImageBuffer = new ArrayBuffer(1000)

      // Mock image fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      // Mock profile fetch (for registerImageUpload)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      // Mock image upload registration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: {
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://upload.linkedin.com/upload',
              },
            },
            asset: 'urn:li:digitalmediaAsset:12345',
          },
        }),
      } as Response)

      // Mock image upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      // Mock profile fetch (for post creation)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      // Mock post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockPostId, activity: mockPostId }),
      } as Response)

      const result = await publishLinkedInPost(mockAccessToken, {
        text: 'Test post with image',
        imageUrl,
      })

      expect(result.id).toBe(mockPostId)
      // Verify image was fetched
      expect(mockFetch).toHaveBeenCalledWith(imageUrl)
    })

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response)

      await expect(
        publishLinkedInPost(mockAccessToken, { text: 'Test post' })
      ).rejects.toThrow('LinkedIn API error: 400 Bad Request')
    })
  })

  describe('publishLinkedInPostWithImage', () => {
    const imageUrl = 'https://example.com/image.jpg'
    const mockImageBuffer = new ArrayBuffer(5 * 1024 * 1024) // 5MB
    const uploadUrl = 'https://upload.linkedin.com/upload'
    const assetUrn = 'urn:li:digitalmediaAsset:12345'

    it('publishes post with image successfully', async () => {
      // Step 1: Fetch image
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      // Step 2: Get profile for registerImageUpload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      // Step 3: Register image upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: {
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl,
              },
            },
            asset: assetUrn,
          },
        }),
      } as Response)

      // Step 4: Upload image binary
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      // Step 5: Get profile for post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      // Step 6: Create UGC post with image
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
          activity: mockPostId,
        }),
      } as Response)

      const result = await publishLinkedInPostWithImage(mockAccessToken, {
        text: 'Test post with image',
        imageUrl,
      })

      expect(result.id).toBe(mockPostId)

      // Verify image upload registration
      const registerCall = mockFetch.mock.calls[2]
      expect(registerCall[0]).toBe(
        'https://api.linkedin.com/v2/assets?action=registerUpload'
      )
      const registerBody = JSON.parse(registerCall[1]?.body as string)
      expect(registerBody.registerUploadRequest.owner).toBe(mockProfileId)

      // Verify image upload
      const uploadCall = mockFetch.mock.calls[3]
      expect(uploadCall[0]).toBe(uploadUrl)
      expect(uploadCall[1]?.method).toBe('PUT')
      const uploadHeaders = uploadCall[1]?.headers as Record<string, string>
      expect(uploadHeaders?.['Content-Type']).toBe('application/octet-stream')

      // Verify post creation with image
      const postCall = mockFetch.mock.calls[5]
      const postBody = JSON.parse(postCall[1]?.body as string)
      expect(
        postBody.specificContent['com.linkedin.ugc.ShareContent']
          .shareMediaCategory
      ).toBe('IMAGE')
      expect(
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media[0].media
      ).toBe(assetUrn)
    })

    it('throws error if imageUrl is missing', async () => {
      await expect(
        publishLinkedInPostWithImage(mockAccessToken, {
          text: 'Test post',
        } as { text: string; imageUrl: string })
      ).rejects.toThrow('imageUrl is required for image posts')
    })

    it('throws error if image fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      await expect(
        publishLinkedInPostWithImage(mockAccessToken, {
          text: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Failed to fetch image from')
    })

    it('throws error if image is too large', async () => {
      const largeImageBuffer = new ArrayBuffer(11 * 1024 * 1024) // 11MB

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => largeImageBuffer,
      } as Response)

      await expect(
        publishLinkedInPostWithImage(mockAccessToken, {
          text: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Image too large')
    })

    it('throws error if image upload registration fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response)

      await expect(
        publishLinkedInPostWithImage(mockAccessToken, {
          text: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Failed to register image upload')
    })

    it('throws error if image upload fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: {
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl,
              },
            },
            asset: assetUrn,
          },
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response)

      await expect(
        publishLinkedInPostWithImage(mockAccessToken, {
          text: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Failed to upload image')
    })

    it('truncates text to 200 chars for description and title', async () => {
      const longText = 'a'.repeat(300)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: {
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl,
              },
            },
            asset: assetUrn,
          },
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: mockProfileId }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockPostId, activity: mockPostId }),
      } as Response)

      await publishLinkedInPostWithImage(mockAccessToken, {
        text: longText,
        imageUrl,
      })

      const postBody = JSON.parse(mockFetch.mock.calls[5][1]?.body as string)
      const media =
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media[0]
      expect(media.description.text).toHaveLength(200)
      expect(media.title.text).toHaveLength(200)
    })
  })
})
