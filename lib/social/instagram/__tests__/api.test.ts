/**
 * Tests for Instagram Graph API client
 * All Instagram API calls are mocked to prevent real API requests
 */

import { publishInstagramPost, getInstagramBusinessAccount } from '../api'

// Mock global fetch
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Instagram API Client', () => {
  const mockPageAccessToken = 'test-page-access-token'
  const mockPageId = '123456789'
  const mockIgUserId = '987654321'
  const mockContainerId = '555555555'
  const mockPostId = '111111111'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getInstagramBusinessAccount', () => {
    it('returns Instagram Business Account ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      const igAccountId = await getInstagramBusinessAccount(
        mockPageAccessToken,
        mockPageId
      )

      expect(igAccountId).toBe(mockIgUserId)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://graph.facebook.com/v18.0/${mockPageId}?fields=instagram_business_account{id}&access_token=${mockPageAccessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('throws error if Instagram Business Account not linked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: null,
        }),
      } as Response)

      await expect(
        getInstagramBusinessAccount(mockPageAccessToken, mockPageId)
      ).rejects.toThrow('Instagram Business Account not found')
    })

    it('throws error if API call fails', async () => {
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

      await expect(
        getInstagramBusinessAccount(mockPageAccessToken, mockPageId)
      ).rejects.toThrow('Invalid access token')
    })
  })

  describe('publishInstagramPost', () => {
    const imageUrl = 'https://example.com/image.jpg'
    const caption = 'Test Instagram caption'
    const hashtags = ['leadership', 'coaching']

    it('publishes post successfully with container ready immediately', async () => {
      // Step 1: Get Instagram Business Account ID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      // Step 2: Create media container (status: FINISHED immediately)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockContainerId,
          status_code: 'FINISHED',
        }),
      } as Response)

      // Step 3: Publish container
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      const result = await publishInstagramPost(
        mockPageAccessToken,
        mockPageId,
        {
          caption,
          imageUrl,
          hashtags,
        }
      )

      expect(result.id).toBe(mockPostId)

      // Verify container creation
      const containerCall = mockFetch.mock.calls[1]
      expect(containerCall[0]).toBe(
        `https://graph.instagram.com/v18.0/${mockIgUserId}/media`
      )
      expect(containerCall[1]?.method).toBe('POST')
      const containerBody = JSON.parse(containerCall[1]?.body as string)
      expect(containerBody.image_url).toBe(imageUrl)
      expect(containerBody.caption).toContain(caption)
      expect(containerBody.caption).toContain('#leadership')
      expect(containerBody.caption).toContain('#coaching')

      // Verify publish call
      const publishCall = mockFetch.mock.calls[2]
      expect(publishCall[0]).toBe(
        `https://graph.instagram.com/v18.0/${mockIgUserId}/media_publish`
      )
      const publishBody = JSON.parse(publishCall[1]?.body as string)
      expect(publishBody.creation_id).toBe(mockContainerId)
    })

    it('publishes post with polling when container is IN_PROGRESS', async () => {
      // Step 1: Get Instagram Business Account ID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      // Step 2: Create media container (status: IN_PROGRESS)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockContainerId,
          status_code: 'IN_PROGRESS',
        }),
      } as Response)

      // Step 3: Check status (still IN_PROGRESS)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 'IN_PROGRESS',
        }),
      } as Response)

      // Step 4: Check status again (FINISHED)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 'FINISHED',
        }),
      } as Response)

      // Step 5: Publish container
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      const result = await publishInstagramPost(
        mockPageAccessToken,
        mockPageId,
        {
          caption,
          imageUrl,
        }
      )

      expect(result.id).toBe(mockPostId)
      // Verify status was checked
      expect(mockFetch).toHaveBeenCalledWith(
        `https://graph.instagram.com/v18.0/${mockContainerId}?fields=status_code&access_token=${mockPageAccessToken}`,
        expect.any(Object)
      )
    })

    it('throws error if imageUrl is missing', async () => {
      await expect(
        publishInstagramPost(mockPageAccessToken, mockPageId, {
          caption: 'Test caption',
          imageUrl: '',
        })
      ).rejects.toThrow('imageUrl is required for Instagram posts')
    })

    it('throws error if caption exceeds 2,200 characters', async () => {
      const longCaption = 'a'.repeat(2201)
      const hashtags = ['tag1', 'tag2']

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      await expect(
        publishInstagramPost(mockPageAccessToken, mockPageId, {
          caption: longCaption,
          imageUrl,
          hashtags,
        })
      ).rejects.toThrow('Caption too long')
    })

    it('throws error if container status is ERROR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockContainerId,
          status_code: 'IN_PROGRESS',
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 'ERROR',
        }),
      } as Response)

      await expect(
        publishInstagramPost(mockPageAccessToken, mockPageId, {
          caption,
          imageUrl,
        })
      ).rejects.toThrow('Media container processing failed')
    })

    it('throws error if container status is not FINISHED after max polling attempts', async () => {
      // Step 1: Get Instagram Business Account ID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      // Step 2: Create container (IN_PROGRESS)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockContainerId,
          status_code: 'IN_PROGRESS',
        }),
      } as Response)

      // Poll 10 times, all return IN_PROGRESS (simulating container that never finishes)
      // Note: This test will take ~20 seconds due to polling delays
      // In a real scenario, containers should finish processing quickly
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status_code: 'IN_PROGRESS',
          }),
        } as Response)
      }

      await expect(
        publishInstagramPost(mockPageAccessToken, mockPageId, {
          caption,
          imageUrl,
        })
      ).rejects.toThrow('Media container not ready')
    }, 25000)

    it('handles post without hashtags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockContainerId,
          status_code: 'FINISHED',
        }),
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPostId,
        }),
      } as Response)

      await publishInstagramPost(mockPageAccessToken, mockPageId, {
        caption,
        imageUrl,
      })

      const containerBody = JSON.parse(
        (mockFetch.mock.calls[1][1]?.body as string) || '{}'
      )
      expect(containerBody.caption).toBe(caption)
      expect(containerBody.caption).not.toContain('#')
    })

    it('handles container creation API error', async () => {
      // Step 1: Get Instagram Business Account ID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      // Step 2: Create container fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid image URL',
            type: 'OAuthException',
          },
        }),
      } as Response)

      await expect(
        publishInstagramPost(mockPageAccessToken, mockPageId, {
          caption,
          imageUrl,
        })
      ).rejects.toThrow('Invalid image URL')
    })

    it('handles publish API error', async () => {
      // Step 1: Get Instagram Business Account ID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instagram_business_account: {
            id: mockIgUserId,
          },
        }),
      } as Response)

      // Step 2: Create container succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockContainerId,
          status_code: 'FINISHED',
        }),
      } as Response)

      // Step 3: Publish fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Container expired',
            type: 'OAuthException',
          },
        }),
      } as Response)

      await expect(
        publishInstagramPost(mockPageAccessToken, mockPageId, {
          caption,
          imageUrl,
        })
      ).rejects.toThrow('Container expired')
    })
  })
})
