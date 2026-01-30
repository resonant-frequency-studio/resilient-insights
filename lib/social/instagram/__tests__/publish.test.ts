/**
 * Tests for Instagram publishing logic
 * Mocks token management and API calls
 */

// Mock dependencies before imports
jest.mock('../../facebook/tokens', () => ({
  getValidAccessToken: jest.fn(),
  getFacebookPageId: jest.fn(),
}))

jest.mock('../api', () => ({
  publishInstagramPost: jest.fn(),
  getInstagramBusinessAccount: jest.fn(),
}))

import { publishToInstagram } from '../publish'
import { getValidAccessToken, getFacebookPageId } from '../../facebook/tokens'
import { publishInstagramPost } from '../api'

const mockGetValidAccessToken = getValidAccessToken as jest.MockedFunction<
  typeof getValidAccessToken
>
const mockGetFacebookPageId = getFacebookPageId as jest.MockedFunction<
  typeof getFacebookPageId
>
const mockPublishInstagramPost = publishInstagramPost as jest.MockedFunction<
  typeof publishInstagramPost
>

describe('publishToInstagram', () => {
  const mockPostId = 'post-123'
  const mockPageAccessToken = 'test-page-access-token'
  const mockPageId = '123456789'
  const mockInstagramPostId = '987654321'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('publishes post successfully with caption and hashtags', async () => {
    const caption = 'Test Instagram caption'
    const imageUrl = 'https://example.com/image.jpg'
    const hashtags = ['leadership', 'coaching']

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishInstagramPost.mockResolvedValueOnce({
      id: mockInstagramPostId,
    })

    const result = await publishToInstagram({
      postId: mockPostId,
      caption,
      imageUrl,
      hashtags,
    })

    expect(result.success).toBe(true)
    expect(result.postId).toBe(mockInstagramPostId)
    expect(result.error).toBeUndefined()

    expect(mockGetValidAccessToken).toHaveBeenCalledWith(mockPostId)
    expect(mockGetFacebookPageId).toHaveBeenCalledWith(mockPostId)
    expect(mockPublishInstagramPost).toHaveBeenCalledWith(
      mockPageAccessToken,
      mockPageId,
      {
        caption,
        imageUrl,
        hashtags,
      }
    )
  })

  it('publishes post without hashtags', async () => {
    const caption = 'Test caption'
    const imageUrl = 'https://example.com/image.jpg'

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishInstagramPost.mockResolvedValueOnce({
      id: mockInstagramPostId,
    })

    const result = await publishToInstagram({
      postId: mockPostId,
      caption,
      imageUrl,
    })

    expect(result.success).toBe(true)
    expect(mockPublishInstagramPost).toHaveBeenCalledWith(
      mockPageAccessToken,
      mockPageId,
      {
        caption,
        imageUrl,
      }
    )
  })

  it('returns error if caption with hashtags exceeds 2,200 characters', async () => {
    const longCaption = 'a'.repeat(2190)
    const hashtags = ['tag1', 'tag2', 'tag3'] // This will push it over 2200

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: longCaption,
      imageUrl: 'https://example.com/image.jpg',
      hashtags,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Caption too long')
    expect(result.error).toContain('2,200 characters')
    expect(mockPublishInstagramPost).not.toHaveBeenCalled()
  })

  it('returns error if caption is exactly 2,200 characters (should pass)', async () => {
    const exactCaption = 'a'.repeat(2200)

    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishInstagramPost.mockResolvedValueOnce({
      id: mockInstagramPostId,
    })

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: exactCaption,
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.success).toBe(true)
    expect(mockPublishInstagramPost).toHaveBeenCalled()
  })

  it('returns error if imageUrl is missing', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: 'Test caption',
      imageUrl: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Image URL is required for Instagram posts')
    expect(mockPublishInstagramPost).not.toHaveBeenCalled()
  })

  it('returns error if token retrieval fails', async () => {
    mockGetValidAccessToken.mockRejectedValueOnce(
      new Error('Facebook account not connected')
    )

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: 'Test caption',
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Facebook account not connected')
    expect(mockPublishInstagramPost).not.toHaveBeenCalled()
  })

  it('returns error if page ID not found', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(null)

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: 'Test caption',
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Facebook page ID not found')
    expect(mockPublishInstagramPost).not.toHaveBeenCalled()
  })

  it('returns error if API call fails', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishInstagramPost.mockRejectedValueOnce(
      new Error('Instagram API error: 400 Invalid image URL')
    )

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: 'Test caption',
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Instagram API error: 400 Invalid image URL')
  })

  it('handles unknown errors gracefully', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishInstagramPost.mockRejectedValueOnce('Unknown error string')

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: 'Test caption',
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown error')
  })

  it('handles empty hashtags array', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockPageAccessToken)
    mockGetFacebookPageId.mockResolvedValueOnce(mockPageId)
    mockPublishInstagramPost.mockResolvedValueOnce({
      id: mockInstagramPostId,
    })

    const result = await publishToInstagram({
      postId: mockPostId,
      caption: 'Test caption',
      imageUrl: 'https://example.com/image.jpg',
      hashtags: [],
    })

    expect(result.success).toBe(true)
    expect(mockPublishInstagramPost).toHaveBeenCalledWith(
      mockPageAccessToken,
      mockPageId,
      {
        caption: 'Test caption',
        imageUrl: 'https://example.com/image.jpg',
      }
    )
  })
})
