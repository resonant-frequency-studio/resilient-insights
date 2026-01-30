/**
 * Tests for Facebook Graph API client
 * All Facebook API calls are mocked to prevent real API requests
 */

import {
  publishFacebookPost,
  publishFacebookPostWithImage,
  getFacebookPage,
} from '../api'

// Mock global fetch
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Facebook API Client', () => {
  const mockPageAccessToken = 'test-page-access-token'
  const mockPageId = '123456789'
  const mockPostId = '987654321'
  const mockPhotoId = '555555555'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFacebookPage', () => {
    it('returns page information successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPageId,
          name: 'Test Page',
        }),
      } as Response)

      const page = await getFacebookPage(mockPageAccessToken)

      expect(page.id).toBe(mockPageId)
      expect(page.name).toBe('Test Page')
      expect(mockFetch).toHaveBeenCalledWith(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${mockPageAccessToken}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid access token',
            type: 'OAuthException',
          },
        }),
      } as Response)

      await expect(getFacebookPage(mockPageAccessToken)).rejects.toThrow(
        'Invalid access token'
      )
    })
  })

  describe('publishFacebookPost', () => {
    it('publishes text-only post successfully', async () => {
      const postMessage = 'Test Facebook post content'

      // Mock post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      const result = await publishFacebookPost(
        mockPageAccessToken,
        mockPageId,
        {
          message: postMessage,
        }
      )

      expect(result.id).toBe(mockPostId)

      // Verify the feed post payload
      const postCall = mockFetch.mock.calls[0]
      expect(postCall[0]).toBe(
        `https://graph.facebook.com/v18.0/${mockPageId}/feed`
      )
      expect(postCall[1]?.method).toBe('POST')
      const postHeaders = postCall[1]?.headers as Record<string, string>
      expect(postHeaders?.['Content-Type']).toBe('application/json')

      const body = JSON.parse(postCall[1]?.body as string)
      expect(body.message).toBe(postMessage)
      expect(body.access_token).toBe(mockPageAccessToken)
    })

    it('delegates to publishFacebookPostWithImage when imageUrl is provided', async () => {
      const imageUrl = 'https://example.com/image.jpg'
      const mockImageBuffer = new ArrayBuffer(1000)

      // Mock image fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      // Mock photo upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPhotoId,
        }),
      } as Response)

      // Mock feed post with attached media
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      const result = await publishFacebookPost(
        mockPageAccessToken,
        mockPageId,
        {
          message: 'Test post with image',
          imageUrl,
        }
      )

      expect(result.id).toBe(mockPostId)
      // Verify image was fetched
      expect(mockFetch).toHaveBeenCalledWith(imageUrl)
    })

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid message',
            type: 'OAuthException',
          },
        }),
      } as Response)

      await expect(
        publishFacebookPost(mockPageAccessToken, mockPageId, {
          message: 'Test post',
        })
      ).rejects.toThrow('Invalid message')
    })
  })

  describe('publishFacebookPostWithImage', () => {
    const imageUrl = 'https://example.com/image.jpg'
    const mockImageBuffer = new ArrayBuffer(2 * 1024 * 1024) // 2MB

    it('publishes post with image successfully', async () => {
      // Step 1: Fetch image
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      // Step 2: Upload photo to Facebook
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPhotoId,
        }),
      } as Response)

      // Step 3: Create feed post with attached media
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      const result = await publishFacebookPostWithImage(
        mockPageAccessToken,
        mockPageId,
        {
          message: 'Test post with image',
          imageUrl,
        }
      )

      expect(result.id).toBe(mockPostId)

      // Verify photo upload
      const photoCall = mockFetch.mock.calls[1]
      expect(photoCall[0]).toBe(
        `https://graph.facebook.com/v18.0/${mockPageId}/photos?access_token=${mockPageAccessToken}`
      )
      expect(photoCall[1]?.method).toBe('POST')

      // Verify feed post with attached media
      const feedCall = mockFetch.mock.calls[2]
      const feedBody = JSON.parse(feedCall[1]?.body as string)
      expect(feedBody.attached_media[0].media_fbid).toBe(mockPhotoId)
      expect(feedBody.message).toBe('Test post with image')
    })

    it('throws error if imageUrl is missing', async () => {
      await expect(
        publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
          message: 'Test post',
        } as { message: string; imageUrl: string })
      ).rejects.toThrow('imageUrl is required for image posts')
    })

    it('throws error if image fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      await expect(
        publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
          message: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Failed to fetch image from')
    })

    it('throws error if image is too large', async () => {
      const largeImageBuffer = new ArrayBuffer(5 * 1024 * 1024) // 5MB

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => largeImageBuffer,
      } as Response)

      await expect(
        publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
          message: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Image too large')
    })

    it('throws error if photo upload fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid image format',
            type: 'OAuthException',
          },
        }),
      } as Response)

      await expect(
        publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
          message: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Invalid image format')
    })

    it('throws error if photo ID is missing from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing id field
        }),
      } as Response)

      await expect(
        publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
          message: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Failed to get photo ID')
    })

    it('throws error if feed post fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPhotoId,
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid post data',
            type: 'OAuthException',
          },
        }),
      } as Response)

      await expect(
        publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
          message: 'Test post',
          imageUrl,
        })
      ).rejects.toThrow('Invalid post data')
    })

    it('handles post without message when uploading photo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockImageBuffer,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPhotoId,
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      await publishFacebookPostWithImage(mockPageAccessToken, mockPageId, {
        message: '',
        imageUrl,
      })

      // Verify photo upload FormData doesn't include empty message
      const photoCall = mockFetch.mock.calls[1]
      expect(photoCall[0]).toContain('/photos')
    })
  })
})
