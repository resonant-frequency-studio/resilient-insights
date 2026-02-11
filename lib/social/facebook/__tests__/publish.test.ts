/**
 * Tests for Facebook publishing logic
 * Mocks token management and API calls
 */

// Mock dependencies before imports
jest.mock('../tokens', () => ({
  getValidAccessToken: jest.fn(),
  getFacebookPageId: jest.fn(),
}))

jest.mock('../api', () => ({
  publishFacebookPost: jest.fn(),
}))

import { publishToFacebook } from '../publish'
import { getValidAccessToken, getFacebookPageId } from '../tokens'
import { publishFacebookPost } from '../api'

const mockGetValidAccessToken = getValidAccessToken as jest.MockedFunction<
  typeof getValidAccessToken
>
const mockGetFacebookPageId = getFacebookPageId as jest.MockedFunction<
  typeof getFacebookPageId
>
const mockPublishFacebookPost = publishFacebookPost as jest.MockedFunction<
  typeof publishFacebookPost
>

describe('publishToFacebook', () => {
  const mockPostId = 'post-123'
  const mockPageAccessToken = 'test-page-access-token'
  const mockPageId = '123456789'
  const mockFacebookPostId = '987654321'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('publishes text-only post successfully', async () => {
    const content = 'Test Facebook post content'

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishFacebookPost.mockResolvedValueOnce({
      id: mockFacebookPostId,
    })

    const result = await publishToFacebook({
      postId: mockPostId,
      content,
    })

    expect(result.success).toBe(true)
    expect(result.postId).toBe(mockFacebookPostId)
    expect(result.error).toBeUndefined()

    expect(mockGetValidAccessToken).toHaveBeenCalledWith(mockPostId)
    expect(mockGetFacebookPageId).toHaveBeenCalledWith(mockPostId)
    expect(mockPublishFacebookPost).toHaveBeenCalledWith(
      mockPageAccessToken,
      mockPageId,
      {
        message: content,
      }
    )
  })

  it('publishes post with image successfully', async () => {
    const content = 'Test post with image'
    const imageUrl = 'https://example.com/image.jpg'

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishFacebookPost.mockResolvedValueOnce({
      id: mockFacebookPostId,
    })

    const result = await publishToFacebook({
      postId: mockPostId,
      content,
      imageUrl,
    })

    expect(result.success).toBe(true)
    expect(result.postId).toBe(mockFacebookPostId)

    expect(mockPublishFacebookPost).toHaveBeenCalledWith(
      mockPageAccessToken,
      mockPageId,
      {
        message: content,
        imageUrl,
      }
    )
  })

  it('returns error if content exceeds 63,206 characters', async () => {
    const longContent = 'a'.repeat(63207)

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)

    const result = await publishToFacebook({
      postId: mockPostId,
      content: longContent,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Content too long')
    expect(result.error).toContain('63,206 characters')
    expect(mockPublishFacebookPost).not.toHaveBeenCalled()
  })

  it('returns error if content is exactly 63,206 characters (should pass)', async () => {
    const exactContent = 'a'.repeat(63206)

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishFacebookPost.mockResolvedValueOnce({
      id: mockFacebookPostId,
    })

    const result = await publishToFacebook({
      postId: mockPostId,
      content: exactContent,
    })

    expect(result.success).toBe(true)
    expect(mockPublishFacebookPost).toHaveBeenCalled()
  })

  it('returns error if token retrieval fails', async () => {
    mockGetValidAccessToken.mockRejectedValueOnce(
      new Error('Facebook account not connected')
    )

    const result = await publishToFacebook({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Facebook account not connected')
    expect(mockPublishFacebookPost).not.toHaveBeenCalled()
  })

  it('returns error if page ID not found', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(null)

    const result = await publishToFacebook({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Facebook page ID not found')
    expect(mockPublishFacebookPost).not.toHaveBeenCalled()
  })

  it('returns error if API call fails', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishFacebookPost.mockRejectedValueOnce(
      new Error('Facebook API error: 400 Invalid message')
    )

    const result = await publishToFacebook({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Facebook API error: 400 Invalid message')
  })

  it('handles unknown errors gracefully', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishFacebookPost.mockRejectedValueOnce('Unknown error string')

    const result = await publishToFacebook({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown error')
  })

  it('handles empty content', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishFacebookPost.mockResolvedValueOnce({
      id: mockFacebookPostId,
    })

    const result = await publishToFacebook({
      postId: mockPostId,
      content: '',
    })

    expect(result.success).toBe(true)
    expect(mockPublishFacebookPost).toHaveBeenCalledWith(
      mockPageAccessToken,
      mockPageId,
      {
        message: '',
      }
    )
  })
})
