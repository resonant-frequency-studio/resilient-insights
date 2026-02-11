/**
 * Tests for LinkedIn publishing logic
 * Mocks token management and API calls
 */

// Mock dependencies before imports
jest.mock('../tokens', () => ({
  getValidAccessToken: jest.fn(),
}))

jest.mock('../api', () => ({
  publishLinkedInPost: jest.fn(),
}))

import { publishToLinkedIn } from '../publish'
import { getValidAccessToken } from '../tokens'
import { publishLinkedInPost } from '../api'

const mockGetValidAccessToken = getValidAccessToken as jest.MockedFunction<
  typeof getValidAccessToken
>
const mockPublishLinkedInPost = publishLinkedInPost as jest.MockedFunction<
  typeof publishLinkedInPost
>

describe('publishToLinkedIn', () => {
  const mockPostId = 'post-123'
  const mockAccessToken = 'test-access-token'
  const mockLinkedInPostId = 'urn:li:ugcPost:67890'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('publishes text-only post successfully', async () => {
    const content = 'Test LinkedIn post content'

    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)
    mockPublishLinkedInPost.mockResolvedValueOnce({
      id: mockLinkedInPostId,
      activity: mockLinkedInPostId,
    })

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content,
    })

    expect(result.success).toBe(true)
    expect(result.postId).toBe(mockLinkedInPostId)
    expect(result.error).toBeUndefined()

    expect(mockGetValidAccessToken).toHaveBeenCalledWith(mockPostId)
    expect(mockPublishLinkedInPost).toHaveBeenCalledWith(mockAccessToken, {
      text: content,
    })
  })

  it('publishes post with image successfully', async () => {
    const content = 'Test post with image'
    const imageUrl = 'https://example.com/image.jpg'

    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)
    mockPublishLinkedInPost.mockResolvedValueOnce({
      id: mockLinkedInPostId,
      activity: mockLinkedInPostId,
    })

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content,
      imageUrl,
    })

    expect(result.success).toBe(true)
    expect(result.postId).toBe(mockLinkedInPostId)

    expect(mockPublishLinkedInPost).toHaveBeenCalledWith(mockAccessToken, {
      text: content,
      imageUrl,
    })
  })

  it('returns error if content exceeds 3000 characters', async () => {
    const longContent = 'a'.repeat(3001)

    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content: longContent,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Content too long')
    expect(result.error).toContain('3000 characters')
    expect(mockPublishLinkedInPost).not.toHaveBeenCalled()
  })

  it('returns error if content is exactly 3000 characters (should pass)', async () => {
    const exactContent = 'a'.repeat(3000)

    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)
    mockPublishLinkedInPost.mockResolvedValueOnce({
      id: mockLinkedInPostId,
      activity: mockLinkedInPostId,
    })

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content: exactContent,
    })

    expect(result.success).toBe(true)
    expect(mockPublishLinkedInPost).toHaveBeenCalled()
  })

  it('returns error if token retrieval fails', async () => {
    mockGetValidAccessToken.mockRejectedValueOnce(
      new Error('LinkedIn account not connected')
    )

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('LinkedIn account not connected')
    expect(mockPublishLinkedInPost).not.toHaveBeenCalled()
  })

  it('returns error if API call fails', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)
    mockPublishLinkedInPost.mockRejectedValueOnce(
      new Error('LinkedIn API error: 400 Bad Request')
    )

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('LinkedIn API error: 400 Bad Request')
  })

  it('handles unknown errors gracefully', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)
    mockPublishLinkedInPost.mockRejectedValueOnce('Unknown error string')

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content: 'Test post',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown error')
  })

  it('handles empty content', async () => {
    mockGetValidAccessToken.mockResolvedValueOnce(mockAccessToken)
    mockPublishLinkedInPost.mockResolvedValueOnce({
      id: mockLinkedInPostId,
      activity: mockLinkedInPostId,
    })

    const result = await publishToLinkedIn({
      postId: mockPostId,
      content: '',
    })

    expect(result.success).toBe(true)
    expect(mockPublishLinkedInPost).toHaveBeenCalledWith(mockAccessToken, {
      text: '',
    })
  })
})
