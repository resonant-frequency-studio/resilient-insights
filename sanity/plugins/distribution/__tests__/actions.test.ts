import {
  generateNewsletterDraft,
  generateMediumDraft,
  generateLinkedInDraft,
  generateFacebookDraft,
  generateInstagramDraft,
  generateAndSchedule,
  schedulePost,
  getRecommendations,
  connectLinkedIn,
  disconnectLinkedIn,
} from '../actions'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Note: window.location.origin in jsdom defaults to http://localhost
// The actual origin doesn't matter for testing - we just verify the endpoint path

describe('distribution actions', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('generateNewsletterDraft', () => {
    it('calls correct endpoint with postId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      })

      await generateNewsletterDraft('post-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/generate/newsletter'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ postId: 'post-123', force: false }),
        })
      )
    })

    it('passes force parameter when true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateNewsletterDraft('post-123', true)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ postId: 'post-123', force: true }),
        })
      )
    })

    it('returns success response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { newsletter: {} } }),
      })

      const result = await generateNewsletterDraft('post-123')
      expect(result.success).toBe(true)
    })

    it('returns error on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      const result = await generateNewsletterDraft('post-123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const result = await generateNewsletterDraft('post-123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network failure')
    })
  })

  describe('generateMediumDraft', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateMediumDraft('post-456')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/generate/medium'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ postId: 'post-456', force: false }),
        })
      )
    })
  })

  describe('generateLinkedInDraft', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateLinkedInDraft('post-789')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/generate/linkedin'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ postId: 'post-789', force: false }),
        })
      )
    })
  })

  describe('generateFacebookDraft', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateFacebookDraft('post-abc')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/generate/facebook'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ postId: 'post-abc', force: false }),
        })
      )
    })
  })

  describe('generateInstagramDraft', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateInstagramDraft('post-def')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/generate/instagram'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ postId: 'post-def', force: false }),
        })
      )
    })
  })

  describe('generateAndSchedule', () => {
    it('calls correct endpoint with all parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateAndSchedule(
        'article-123',
        ['linkedin', 'facebook'],
        '2026-01-20T09:00:00Z'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/generate-and-schedule'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            articleId: 'article-123',
            channels: ['linkedin', 'facebook'],
            publishAt: '2026-01-20T09:00:00Z',
          }),
        })
      )
    })

    it('works without publishAt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await generateAndSchedule('article-123', ['instagram'])

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            articleId: 'article-123',
            channels: ['instagram'],
            publishAt: undefined,
          }),
        })
      )
    })
  })

  describe('schedulePost', () => {
    it('calls correct endpoint with all parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await schedulePost(
        'article-456',
        'linkedin',
        'Post content here',
        '2026-01-20T09:00:00Z',
        'https://cdn.sanity.io/images/test.jpg'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/distribution/schedule'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            articleId: 'article-456',
            channel: 'linkedin',
            content: 'Post content here',
            scheduledAt: '2026-01-20T09:00:00Z',
            imageUrl: 'https://cdn.sanity.io/images/test.jpg',
          }),
        })
      )
    })

    it('works without imageUrl', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await schedulePost(
        'article-456',
        'facebook',
        'Content',
        '2026-01-20T09:00:00Z'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            articleId: 'article-456',
            channel: 'facebook',
            content: 'Content',
            scheduledAt: '2026-01-20T09:00:00Z',
            imageUrl: undefined,
          }),
        })
      )
    })
  })

  describe('getRecommendations', () => {
    it('uses GET request with query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ times: [] }),
      })

      await getRecommendations('linkedin', '2026-01-15')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/distribution/recommendations?channel=linkedin&date=2026-01-15'
        ),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      )
    })

    it('returns success with data', async () => {
      const mockData = {
        times: ['2026-01-15T09:00:00Z', '2026-01-15T12:00:00Z'],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await getRecommendations('facebook', '2026-01-15')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('returns error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid channel' }),
      })

      const result = await getRecommendations('linkedin', '2026-01-15')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid channel')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await getRecommendations('instagram', '2026-01-15')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection refused')
    })
  })

  describe('connectLinkedIn', () => {
    it('constructs URL with postId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authUrl: 'https://linkedin.com/oauth' }),
      })

      await connectLinkedIn('post-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/linkedin?postId=post-123')
      )
    })

    it('includes returnUrl when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authUrl: 'https://linkedin.com/oauth' }),
      })

      await connectLinkedIn('post-123', 'http://localhost:3000/callback')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'returnUrl=http%3A%2F%2Flocalhost%3A3000%2Fcallback'
        )
      )
    })

    it('returns authUrl on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authUrl: 'https://linkedin.com/oauth/authorize' }),
      })

      const result = await connectLinkedIn('post-123')
      expect(result.success).toBe(true)
      expect(result.authUrl).toBe('https://linkedin.com/oauth/authorize')
    })

    it('returns error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      const result = await connectLinkedIn('post-123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('disconnectLinkedIn', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await disconnectLinkedIn('post-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/linkedin/disconnect'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ postId: 'post-123' }),
        })
      )
    })

    it('returns success response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await disconnectLinkedIn('post-123')
      expect(result.success).toBe(true)
    })
  })

  describe('error handling', () => {
    it('handles non-Error thrown objects', async () => {
      mockFetch.mockRejectedValueOnce('string error')

      const result = await generateNewsletterDraft('post-123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('handles HTTP error without error message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      })

      const result = await generateMediumDraft('post-123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('HTTP 503')
    })
  })
})
