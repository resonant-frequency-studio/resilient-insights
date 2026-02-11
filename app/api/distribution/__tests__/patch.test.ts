import { POST } from '../patch/route'
import { writeClient } from '@/lib/sanity/writeClient'
import { NextRequest } from 'next/server'

jest.mock('@/lib/sanity/writeClient', () => ({
  writeClient: {
    patch: jest.fn(),
    fetch: jest.fn(),
  },
}))

jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      private _headers: Headers
      private _body: string
      constructor(
        _url: string,
        init?: { headers?: HeadersInit; body?: string }
      ) {
        this._headers = new Headers(init?.headers || {})
        this._body = init?.body || ''
      }
      get headers() {
        return {
          get: (name: string) => {
            return this._headers.get(name) || null
          },
        } as Pick<Headers, 'get'>
      }
      async json() {
        return JSON.parse(this._body || '{}')
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

const mockPatch = writeClient.patch as jest.Mock

describe('POST /api/distribution/patch', () => {
  const originalEnv = process.env

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

  const createRequest = (body: unknown, headers?: HeadersInit) => {
    const baseHeaders = new Headers(headers || {})
    return new NextRequest('http://localhost:3000/api/distribution/patch', {
      headers: baseHeaders,
      body: JSON.stringify(body),
    })
  }

  it('returns 401 when unauthorized', async () => {
    const request = createRequest({ postId: 'post-1', path: ['distribution'] })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid path', async () => {
    const headers = new Headers()
    headers.set('X-DISTRIBUTION-SECRET', 'test-secret')
    const request = createRequest(
      { postId: 'post-1', path: ['invalid', 'path'], value: {} },
      headers
    )
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('patches distribution content when valid', async () => {
    const headers = new Headers()
    headers.set('X-DISTRIBUTION-SECRET', 'test-secret')
    const request = createRequest(
      {
        distributionDocId: 'dist-1',
        path: ['newsletter'],
        value: { title: 'Hello' },
      },
      headers
    )

    const commit = jest.fn().mockResolvedValue(undefined)
    const set = jest.fn().mockReturnValue({ commit })
    mockPatch.mockReturnValue({ set })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPatch).toHaveBeenCalledWith('dist-1')
    expect(set).toHaveBeenCalledWith({
      newsletter: { title: 'Hello' },
    })
    expect(commit).toHaveBeenCalled()
  })
})
