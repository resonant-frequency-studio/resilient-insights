import { checkRateLimit, getRateLimitStatus } from '../gemini'

// Mock Date.now() to control time in tests
const mockNow = jest.fn()
const originalDateNow = Date.now

beforeAll(() => {
  Date.now = mockNow
})

afterAll(() => {
  Date.now = originalDateNow
})

beforeEach(() => {
  mockNow.mockReturnValue(1000000) // Base time: 1000000ms
  jest.clearAllMocks()
})

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test-key')
    expect(result.allowed).toBe(true)
    expect(result.remainingMs).toBeUndefined()
  })

  it('blocks request within rate limit window', () => {
    checkRateLimit('test-key')

    // Move forward 30 seconds (half the window)
    mockNow.mockReturnValue(1000000 + 30000)

    const result = checkRateLimit('test-key')
    expect(result.allowed).toBe(false)
    expect(result.remainingMs).toBeGreaterThan(0)
    expect(result.remainingMs).toBeLessThanOrEqual(30000)
  })

  it('allows request after rate limit window expires', () => {
    checkRateLimit('test-key')

    // Move forward past the window (61 seconds)
    mockNow.mockReturnValue(1000000 + 61000)

    const result = checkRateLimit('test-key')
    expect(result.allowed).toBe(true)
    expect(result.remainingMs).toBeUndefined()
  })

  it('calculates remaining time correctly', () => {
    // Set initial rate limit
    checkRateLimit('calc-key')

    // Move forward 45 seconds
    mockNow.mockReturnValue(1000000 + 45000)

    // Use getRateLimitStatus to check without updating cache
    const result = getRateLimitStatus('calc-key')
    expect(result.allowed).toBe(false)
    // Should have exactly 15 seconds remaining (60s - 45s)
    expect(result.remainingMs).toBe(15000)
  })

  it('uses different keys independently', () => {
    checkRateLimit('key-1')
    checkRateLimit('key-2')

    // Move forward 30 seconds
    mockNow.mockReturnValue(1000000 + 30000)

    // Both should be rate limited
    const result1 = checkRateLimit('key-1')
    const result2 = checkRateLimit('key-2')

    expect(result1.allowed).toBe(false)
    expect(result2.allowed).toBe(false)
  })

  it('allows custom rate limit window', () => {
    const customWindow = 5000 // 5 seconds
    checkRateLimit('custom-key', customWindow)

    // Move forward 3 seconds
    mockNow.mockReturnValue(1000000 + 3000)

    const result = checkRateLimit('custom-key', customWindow)
    expect(result.allowed).toBe(false)
    expect(result.remainingMs).toBeLessThanOrEqual(2000)

    // Move forward past custom window (6 seconds)
    mockNow.mockReturnValue(1000000 + 6000)

    const result2 = checkRateLimit('custom-key', customWindow)
    expect(result2.allowed).toBe(true)
  })
})

describe('getRateLimitStatus', () => {
  it('returns allowed when no previous request', () => {
    const result = getRateLimitStatus('new-key')
    expect(result.allowed).toBe(true)
    expect(result.remainingMs).toBeUndefined()
  })

  it('returns rate limited status without updating cache', () => {
    // First, set a rate limit using checkRateLimit
    checkRateLimit('status-key')

    // Move forward 30 seconds
    mockNow.mockReturnValue(1000000 + 30000)

    // getRateLimitStatus should show rate limited
    const status1 = getRateLimitStatus('status-key')
    expect(status1.allowed).toBe(false)
    expect(status1.remainingMs).toBeGreaterThan(0)

    // Calling it again should return same status (doesn't update cache)
    const status2 = getRateLimitStatus('status-key')
    expect(status2.allowed).toBe(false)
    expect(status2.remainingMs).toBe(status1.remainingMs)
  })

  it('returns allowed after window expires', () => {
    checkRateLimit('expired-key')

    // Move forward past window
    mockNow.mockReturnValue(1000000 + 61000)

    const result = getRateLimitStatus('expired-key')
    expect(result.allowed).toBe(true)
    expect(result.remainingMs).toBeUndefined()
  })
})
