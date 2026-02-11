/**
 * Social Media Image Optimizer
 * Generates platform-specific image URLs with optimal dimensions
 */

import imageUrlBuilder from '@sanity/image-url'

// Platform-specific image dimensions
export const PLATFORM_DIMENSIONS = {
  linkedin: { width: 1200, height: 627, aspectRatio: '1.91:1' },
  facebook: { width: 1200, height: 630, aspectRatio: '1.91:1' },
  instagram: { width: 1080, height: 1080, aspectRatio: '1:1' },
  // Instagram portrait alternative
  instagramPortrait: { width: 1080, height: 1350, aspectRatio: '4:5' },
} as const

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram'

export interface SanityImageReference {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

/**
 * Create an image URL builder instance
 */
function createBuilder() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

  return imageUrlBuilder({
    projectId,
    dataset,
  })
}

/**
 * Get an optimized image URL for a specific social platform
 * Respects hotspot and crop settings from the original image
 */
export function getOptimizedImageUrl(
  image: SanityImageReference | undefined,
  platform: SocialPlatform
): string | null {
  if (!image?.asset?._ref) {
    return null
  }

  const dimensions = PLATFORM_DIMENSIONS[platform]
  const builder = createBuilder()

  try {
    return builder
      .image(image)
      .width(dimensions.width)
      .height(dimensions.height)
      .fit('crop')
      .auto('format')
      .quality(85)
      .url()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to generate optimized image URL:', error)
    }
    return null
  }
}

/**
 * Get a preview-sized image URL for displaying in the UI
 * Smaller dimensions for faster loading in previews
 */
export function getPreviewImageUrl(
  image: SanityImageReference | undefined,
  platform: SocialPlatform,
  maxWidth = 400
): string | null {
  if (!image?.asset?._ref) {
    return null
  }

  const dimensions = PLATFORM_DIMENSIONS[platform]
  const aspectRatio = dimensions.width / dimensions.height
  const previewHeight = Math.round(maxWidth / aspectRatio)

  const builder = createBuilder()

  try {
    return builder
      .image(image)
      .width(maxWidth)
      .height(previewHeight)
      .fit('crop')
      .auto('format')
      .quality(80)
      .url()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to generate preview image URL:', error)
    }
    return null
  }
}

/**
 * Get the original image URL (no cropping)
 */
export function getOriginalImageUrl(
  image: SanityImageReference | undefined
): string | null {
  if (!image?.asset?._ref) {
    return null
  }

  const builder = createBuilder()

  try {
    return builder.image(image).auto('format').url()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to generate original image URL:', error)
    }
    return null
  }
}

/**
 * Get dimension info for display
 */
export function getPlatformDimensionInfo(platform: SocialPlatform): string {
  const dim = PLATFORM_DIMENSIONS[platform]
  return `${dim.width}×${dim.height} (${dim.aspectRatio})`
}
