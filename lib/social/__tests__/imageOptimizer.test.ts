import {
  PLATFORM_DIMENSIONS,
  getOptimizedImageUrl,
  getPreviewImageUrl,
  getOriginalImageUrl,
  getPlatformDimensionInfo,
  SanityImageReference,
  SocialPlatform,
} from '../imageOptimizer'

// Mock the @sanity/image-url module
jest.mock('@sanity/image-url', () => {
  const mockBuilder = {
    image: jest.fn().mockReturnThis(),
    width: jest.fn().mockReturnThis(),
    height: jest.fn().mockReturnThis(),
    fit: jest.fn().mockReturnThis(),
    auto: jest.fn().mockReturnThis(),
    quality: jest.fn().mockReturnThis(),
    url: jest
      .fn()
      .mockReturnValue(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      ),
  }
  return jest.fn(() => mockBuilder)
})

// Sample valid image reference
const validImage: SanityImageReference = {
  _type: 'image',
  asset: {
    _ref: 'image-abc123-1200x800-jpg',
    _type: 'reference',
  },
}

const imageWithHotspot: SanityImageReference = {
  _type: 'image',
  asset: {
    _ref: 'image-def456-1600x900-jpg',
    _type: 'reference',
  },
  hotspot: {
    x: 0.5,
    y: 0.3,
    height: 0.5,
    width: 0.5,
  },
  crop: {
    top: 0.1,
    bottom: 0.1,
    left: 0.1,
    right: 0.1,
  },
}

describe('imageOptimizer', () => {
  describe('PLATFORM_DIMENSIONS', () => {
    it('exports correct dimensions for LinkedIn', () => {
      expect(PLATFORM_DIMENSIONS.linkedin).toEqual({
        width: 1200,
        height: 627,
        aspectRatio: '1.91:1',
      })
    })

    it('exports correct dimensions for Facebook', () => {
      expect(PLATFORM_DIMENSIONS.facebook).toEqual({
        width: 1200,
        height: 630,
        aspectRatio: '1.91:1',
      })
    })

    it('exports correct dimensions for Instagram', () => {
      expect(PLATFORM_DIMENSIONS.instagram).toEqual({
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
      })
    })

    it('exports correct dimensions for Instagram Portrait', () => {
      expect(PLATFORM_DIMENSIONS.instagramPortrait).toEqual({
        width: 1080,
        height: 1350,
        aspectRatio: '4:5',
      })
    })
  })

  describe('getOptimizedImageUrl', () => {
    it('returns null for undefined image', () => {
      expect(getOptimizedImageUrl(undefined, 'linkedin')).toBeNull()
    })

    it('returns null for image without asset', () => {
      const invalidImage = { _type: 'image' } as SanityImageReference
      expect(getOptimizedImageUrl(invalidImage, 'linkedin')).toBeNull()
    })

    it('returns null for image without asset._ref', () => {
      const invalidImage = {
        _type: 'image',
        asset: { _type: 'reference' },
      } as SanityImageReference
      expect(getOptimizedImageUrl(invalidImage, 'linkedin')).toBeNull()
    })

    it('returns URL for valid LinkedIn image', () => {
      const url = getOptimizedImageUrl(validImage, 'linkedin')
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })

    it('returns URL for valid Facebook image', () => {
      const url = getOptimizedImageUrl(validImage, 'facebook')
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })

    it('returns URL for valid Instagram image', () => {
      const url = getOptimizedImageUrl(validImage, 'instagram')
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })

    it('handles image with hotspot and crop', () => {
      const url = getOptimizedImageUrl(imageWithHotspot, 'linkedin')
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })
  })

  describe('getPreviewImageUrl', () => {
    it('returns null for undefined image', () => {
      expect(getPreviewImageUrl(undefined, 'linkedin')).toBeNull()
    })

    it('returns null for invalid image', () => {
      const invalidImage = { _type: 'image' } as SanityImageReference
      expect(getPreviewImageUrl(invalidImage, 'facebook')).toBeNull()
    })

    it('returns URL for valid image with default maxWidth', () => {
      const url = getPreviewImageUrl(validImage, 'linkedin')
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })

    it('returns URL for valid image with custom maxWidth', () => {
      const url = getPreviewImageUrl(validImage, 'instagram', 600)
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })

    it('calculates correct aspect ratio for LinkedIn preview', () => {
      // LinkedIn: 1200/627 ≈ 1.91
      // With maxWidth 400: height = 400 / 1.91 ≈ 209
      const url = getPreviewImageUrl(validImage, 'linkedin', 400)
      expect(url).not.toBeNull()
    })

    it('calculates correct aspect ratio for Instagram preview', () => {
      // Instagram: 1080/1080 = 1:1
      // With maxWidth 400: height = 400
      const url = getPreviewImageUrl(validImage, 'instagram', 400)
      expect(url).not.toBeNull()
    })
  })

  describe('getOriginalImageUrl', () => {
    it('returns null for undefined image', () => {
      expect(getOriginalImageUrl(undefined)).toBeNull()
    })

    it('returns null for invalid image', () => {
      const invalidImage = { _type: 'image' } as SanityImageReference
      expect(getOriginalImageUrl(invalidImage)).toBeNull()
    })

    it('returns URL for valid image', () => {
      const url = getOriginalImageUrl(validImage)
      expect(url).toBe(
        'https://cdn.sanity.io/images/test-project/production/test-image.jpg'
      )
    })
  })

  describe('getPlatformDimensionInfo', () => {
    it('returns formatted string for LinkedIn', () => {
      expect(getPlatformDimensionInfo('linkedin')).toBe('1200×627 (1.91:1)')
    })

    it('returns formatted string for Facebook', () => {
      expect(getPlatformDimensionInfo('facebook')).toBe('1200×630 (1.91:1)')
    })

    it('returns formatted string for Instagram', () => {
      expect(getPlatformDimensionInfo('instagram')).toBe('1080×1080 (1:1)')
    })

    it('handles all valid platforms', () => {
      const platforms: SocialPlatform[] = ['linkedin', 'facebook', 'instagram']
      platforms.forEach(platform => {
        const info = getPlatformDimensionInfo(platform)
        expect(info).toMatch(/^\d+×\d+ \(\d+\.?\d*:\d+\)$/)
      })
    })
  })
})
