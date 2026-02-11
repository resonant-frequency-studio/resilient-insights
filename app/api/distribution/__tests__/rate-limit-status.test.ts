import { GET } from '../rate-limit-status/route'
import { getRateLimitStatus } from '@/lib/distribution/gemini'
import { NextRequest } from 'next/server'

// Mock the gemini module
jest.mock('@/lib/distribution/gemini', () => ({
  getRateLimitStatus: jest.fn(),
}))

// Mock Next.js server modules
jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string
      private _headers: Headers
      constructor(url: string, init?: { headers?: HeadersInit }) {
        this.url = url
        this._headers = new Headers(init?.headers || {})
      }
      get headers() {
        return {
          get: (name: string) => {
            return this._headers.get(name) || null
          },
        } as Pick<Headers, 'get'>
      }
    },
    NextResponse: {
      json: jest.fn((body: unknown, init?: { status?: number }) => ({
        json: async () => body,
        status: init?.status || 200,
      })),
    },
  }
})

const mockGetRateLimitStatus = getRateLimitStatus as jest.Mock

// Mock environment variable
const originalEnv = process.env

describe('GET /api/distribution/rate-limit-status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      DISTRIBUTION_SECRET: 'test-secret',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const createRequest = (postId: string, contentType: string) => {
    const url = `http://localhost:3000/api/distribution/rate-limit-status?postId=${postId}&contentType=${contentType}`
    const headers = new Headers()
    headers.set('X-DISTRIBUTION-SECRET', 'test-secret')
    return new NextRequest(url, {
      headers,
    })
  }

  it('returns rate limit status when rate limited', async () => {
    mockGetRateLimitStatus.mockReturnValue({
      allowed: false,
      remainingMs: 45000,
    })

    const request = createRequest('post-123', 'newsletter')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rateLimited).toBe(true)
    expect(data.remainingMs).toBe(45000)
    expect(mockGetRateLimitStatus).toHaveBeenCalledWith('newsletter:post-123')
  })

  it('returns not rate limited when allowed', async () => {
    mockGetRateLimitStatus.mockReturnValue({
      allowed: true,
    })

    const request = createRequest('post-123', 'linkedin')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rateLimited).toBe(false)
    expect(data.remainingMs).toBe(0)
  })

  it('handles all content types', async () => {
    const contentTypes = [
      'newsletter',
      'linkedin',
      'facebook',
      'instagram',
      'social',
      'medium',
    ]

    for (const contentType of contentTypes) {
      mockGetRateLimitStatus.mockReturnValue({ allowed: true })
      const request = createRequest('post-123', contentType)
      const response = await GET(request)
      expect(response.status).toBe(200)
    }
  })

  it('returns 401 when unauthorized', async () => {
    const url =
      'http://localhost:3000/api/distribution/rate-limit-status?postId=post-123&contentType=newsletter'
    const unauthorizedRequest = new NextRequest(url, {
      headers: new Headers(),
    })

    const response = await GET(unauthorizedRequest)
    expect(response.status).toBe(401)
  })

  it('returns 400 when postId is missing', async () => {
    const url =
      'http://localhost:3000/api/distribution/rate-limit-status?contentType=newsletter'
    const headers = new Headers()
    headers.set('X-DISTRIBUTION-SECRET', 'test-secret')
    const request = new NextRequest(url, { headers })

    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when contentType is missing', async () => {
    const url =
      'http://localhost:3000/api/distribution/rate-limit-status?postId=post-123'
    const headers = new Headers()
    headers.set('X-DISTRIBUTION-SECRET', 'test-secret')
    const request = new NextRequest(url, { headers })

    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when contentType is invalid', async () => {
    const url =
      'http://localhost:3000/api/distribution/rate-limit-status?postId=post-123&contentType=invalid'
    const headers = new Headers()
    headers.set('X-DISTRIBUTION-SECRET', 'test-secret')
    const request = new NextRequest(url, { headers })

    const response = await GET(request)
    expect(response.status).toBe(400)
  })
})
