import {
  generateNewsletter,
  generateLinkedIn,
  generateFacebook,
  generateInstagram,
  generateSocial,
  generateMedium,
  RateLimitError,
} from '../generate'
import { checkRateLimit, generateWithGemini } from '../gemini'

// Mock the gemini module
jest.mock('../gemini', () => ({
  generateWithGemini: jest.fn(),
  checkRateLimit: jest.fn(),
  getRateLimitStatus: jest.fn(),
}))

// Mock portableText module
jest.mock('@/lib/sanity/portableText', () => ({
  portableTextToPlainText: jest.fn(() => 'Plain text content'),
}))

const mockCheckRateLimit = checkRateLimit as jest.Mock
const mockGenerateWithGemini = generateWithGemini as jest.Mock

describe('RateLimitError', () => {
  it('creates error with remaining time and content type', () => {
    const error = new RateLimitError('Test message', 45000, 'newsletter')

    expect(error.message).toBe('Test message')
    expect(error.remainingMs).toBe(45000)
    expect(error.contentType).toBe('newsletter')
    expect(error.name).toBe('RateLimitError')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('generateNewsletter', () => {
  const mockOptions = {
    title: 'Test Post',
    excerpt: 'Test excerpt',
    body: [],
    canonicalUrl: 'https://example.com/post',
    postId: 'post-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({
        title: 'Newsletter Title',
        subtitle: 'Newsletter Subtitle',
        body: 'Newsletter body content that is long enough to meet the minimum requirement of 150 characters. This ensures the validation passes correctly and the test can verify the generation functionality works as expected.',
        ctaText: 'Click here',
        ctaUrl: 'https://example.com',
      })
    )
  })

  it('throws RateLimitError when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 45000,
    })

    await expect(generateNewsletter(mockOptions)).rejects.toThrow(
      RateLimitError
    )

    const error = await generateNewsletter(mockOptions).catch(e => e)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.remainingMs).toBe(45000)
    expect(error.contentType).toBe('newsletter')
    expect(error.message).toContain('45 second')
  })

  it('generates successfully when not rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: true })

    const result = await generateNewsletter(mockOptions)

    expect(result).toHaveProperty('title')
    expect(result).toHaveProperty('subtitle')
    expect(result).toHaveProperty('body')
    expect(mockCheckRateLimit).toHaveBeenCalledWith('newsletter:post-123')
  })

  it('formats error message correctly for singular second', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 1000, // 1 second
    })

    await expect(generateNewsletter(mockOptions)).rejects.toThrow(
      'Please wait 1 second before generating again.'
    )
  })

  it('formats error message correctly for plural seconds', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 45000, // 45 seconds
    })

    await expect(generateNewsletter(mockOptions)).rejects.toThrow(
      'Please wait 45 seconds before generating again.'
    )
  })
})

describe('generateLinkedIn', () => {
  const mockOptions = {
    title: 'Test Post',
    excerpt: 'Test excerpt',
    body: [],
    canonicalUrl: 'https://example.com/post',
    postId: 'post-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true })
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({ post: 'LinkedIn post content' })
    )
  })

  it('throws RateLimitError with correct content type', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 30000,
    })

    await expect(generateLinkedIn(mockOptions)).rejects.toThrow(RateLimitError)

    const error = await generateLinkedIn(mockOptions).catch(e => e)
    expect(error.contentType).toBe('linkedin')
  })
})

describe('generateFacebook', () => {
  const mockOptions = {
    title: 'Test Post',
    excerpt: 'Test excerpt',
    body: [],
    canonicalUrl: 'https://example.com/post',
    postId: 'post-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true })
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({
        post: 'Facebook post content that is long enough to satisfy the minimum character requirement for validation checks.',
      })
    )
  })

  it('throws RateLimitError with correct content type', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 30000,
    })

    const error = await generateFacebook(mockOptions).catch(e => e)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.contentType).toBe('facebook')
  })

  it('appends canonical URL when missing', async () => {
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({
        post: 'Facebook post content that is long enough to satisfy the minimum character requirement for validation checks.',
      })
    )

    const result = await generateFacebook(mockOptions)

    expect(result.text).toContain(mockOptions.canonicalUrl)
    expect(result.text).toMatch(/Facebook post content/)
  })

  it('does not duplicate canonical URL when present', async () => {
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({
        post: `Facebook post content that is long enough to satisfy the minimum character requirement for validation checks.\n\n${mockOptions.canonicalUrl}`,
      })
    )

    const result = await generateFacebook(mockOptions)

    const occurrences = result.text.split(mockOptions.canonicalUrl).length - 1
    expect(occurrences).toBe(1)
  })
})

describe('generateInstagram', () => {
  const mockOptions = {
    title: 'Test Post',
    excerpt: 'Test excerpt',
    body: [],
    canonicalUrl: 'https://example.com/post',
    postId: 'post-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true })
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({
        caption: 'Instagram caption',
        hashtags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      })
    )
  })

  it('throws RateLimitError with correct content type', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 30000,
    })

    const error = await generateInstagram(mockOptions).catch(e => e)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.contentType).toBe('instagram')
  })
})

describe('generateSocial', () => {
  const mockOptions = {
    title: 'Test Post',
    excerpt: 'Test excerpt',
    body: [],
    canonicalUrl: 'https://example.com/post',
    postId: 'post-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true })
    mockGenerateWithGemini
      .mockResolvedValueOnce(
        JSON.stringify({
          post: 'LinkedIn post content that is long enough to satisfy the minimum character requirement for validation checks and continues a bit more.',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          post: 'Facebook post content that is long enough to satisfy the minimum character requirement for validation checks.',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          caption:
            'Instagram caption that is long enough to satisfy the minimum character requirement for validation checks.',
          hashtags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        })
      )
  })

  it('throws RateLimitError with correct content type', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 30000,
    })

    const error = await generateSocial(mockOptions).catch(e => e)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.contentType).toBe('social')
  })

  it('appends canonical URL to Facebook when missing', async () => {
    const result = await generateSocial(mockOptions)

    expect(result.facebook.text).toContain(mockOptions.canonicalUrl)
  })

  it('does not duplicate canonical URL for Facebook when present', async () => {
    mockGenerateWithGemini
      .mockResolvedValueOnce(
        JSON.stringify({
          post: 'LinkedIn post content that is long enough to satisfy the minimum character requirement for validation checks and continues a bit more.',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          post: `Facebook post content that is long enough to satisfy the minimum character requirement for validation checks.\n\n${mockOptions.canonicalUrl}`,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          caption:
            'Instagram caption that is long enough to satisfy the minimum character requirement for validation checks.',
          hashtags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        })
      )

    const result = await generateSocial(mockOptions)
    const occurrences =
      result.facebook.text.split(mockOptions.canonicalUrl).length - 1
    expect(occurrences).toBe(1)
  })
})

describe('generateMedium', () => {
  const mockOptions = {
    title: 'Test Post',
    excerpt: 'Test excerpt',
    body: [],
    canonicalUrl: 'https://example.com/post',
    postId: 'post-123',
    tags: ['tag1', 'tag2'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true })
    mockGenerateWithGemini.mockResolvedValue(
      JSON.stringify({
        title: 'Medium Title',
        subtitle: 'Medium Subtitle',
        content: 'Medium content',
        tags: ['tag1', 'tag2'],
      })
    )
  })

  it('throws RateLimitError with correct content type', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remainingMs: 30000,
    })

    const error = await generateMedium(mockOptions).catch(e => e)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(error.contentType).toBe('medium')
  })
})
