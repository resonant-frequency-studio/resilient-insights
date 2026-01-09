import { z } from 'zod'
import { generateWithGemini, checkRateLimit } from './gemini'
import { createNewsletterPrompt } from './prompts/newsletter'
import { createLinkedInPrompt } from './prompts/linkedin'
import { createFacebookPrompt } from './prompts/facebook'
import { createInstagramPrompt } from './prompts/instagram'
import {
  createMediumPrompt,
  mediumSchema,
  MediumOutput,
} from './prompts/medium'
import { portableTextToPlainText } from '@/lib/sanity/portableText'

// Zod schemas for validation
// These limits are enforced - the prompt must instruct AI to stay within them
const NewsletterSchema = z.object({
  subject: z.string().max(60), // Email subject line best practice
  preheader: z.string().max(90), // Email preheader best practice (most clients show ~90 chars)
  body: z.string().min(150).max(2000), // Newsletter body (reasonable length for email)
  ctaText: z.string(),
  ctaUrl: z.string().url(),
})

const LinkedInSchema = z.object({
  post: z.string().min(120).max(500),
})

const FacebookSchema = z.object({
  post: z.string().min(80).max(300),
})

const InstagramSchema = z.object({
  caption: z.string().min(80).max(300),
  hashtags: z.array(z.string()).min(5).max(10),
  suggestedFirstComment: z.string().optional(),
})

export interface GenerateOptions {
  title: string
  excerpt: string
  body: unknown // PortableText blocks
  canonicalUrl: string
  postId: string
}

export interface GeneratedNewsletter {
  subject: string
  preheader: string
  body: string
  ctaText: string
  ctaUrl: string
}

export interface GeneratedSocial {
  linkedin: {
    text: string
  }
  facebook: {
    text: string
  }
  instagram: {
    caption: string
    hashtags: string[]
  }
  suggestedFirstComment?: string
}

/**
 * Parse JSON from Gemini response, handling markdown code blocks
 */
function parseGeminiJson(response: string): unknown {
  // Remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '')
  }

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Failed to parse JSON:', cleaned)
    throw new Error(
      `Invalid JSON response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate newsletter content
 */
export async function generateNewsletter(
  options: GenerateOptions
): Promise<GeneratedNewsletter> {
  const rateLimitKey = `newsletter:${options.postId}`
  if (!checkRateLimit(rateLimitKey)) {
    throw new Error(
      'Rate limit exceeded. Please wait a minute before regenerating.'
    )
  }

  const bodyText = portableTextToPlainText(options.body as never)
  const prompt = createNewsletterPrompt(
    options.title,
    options.excerpt || '',
    bodyText,
    options.canonicalUrl
  )

  const response = await generateWithGemini(prompt)
  const parsed = parseGeminiJson(response)

  // Safety net: Truncate fields if AI exceeds limits (shouldn't happen with proper prompting)
  if (typeof parsed === 'object' && parsed !== null) {
    const parsedObj = parsed as Record<string, unknown>
    if (
      typeof parsedObj.subject === 'string' &&
      parsedObj.subject.length > 60
    ) {
      parsedObj.subject = parsedObj.subject.substring(0, 60).trim()
    }
    if (
      typeof parsedObj.preheader === 'string' &&
      parsedObj.preheader.length > 90
    ) {
      parsedObj.preheader = parsedObj.preheader.substring(0, 90).trim()
    }
    if (typeof parsedObj.body === 'string' && parsedObj.body.length > 2000) {
      parsedObj.body = parsedObj.body.substring(0, 2000).trim()
    }
  }

  const validated = NewsletterSchema.parse(parsed)

  return validated
}

/**
 * Generate social media content (LinkedIn, Facebook, Instagram)
 */
export async function generateSocial(
  options: GenerateOptions
): Promise<GeneratedSocial> {
  const rateLimitKey = `social:${options.postId}`
  if (!checkRateLimit(rateLimitKey)) {
    throw new Error(
      'Rate limit exceeded. Please wait a minute before regenerating.'
    )
  }

  const bodyText = portableTextToPlainText(options.body as never)

  // Generate LinkedIn
  const linkedinPrompt = createLinkedInPrompt(
    options.title,
    options.excerpt || '',
    bodyText,
    options.canonicalUrl
  )
  const linkedinResponse = await generateWithGemini(linkedinPrompt)
  const linkedinParsed = parseGeminiJson(linkedinResponse)

  // Safety net: Truncate at sentence boundary if AI exceeds limits
  if (typeof linkedinParsed === 'object' && linkedinParsed !== null) {
    const parsedObj = linkedinParsed as Record<string, unknown>
    if (typeof parsedObj.post === 'string' && parsedObj.post.length > 500) {
      // Truncate at the last complete sentence before the limit
      let truncated = parsedObj.post.substring(0, 500).trim()
      const lastPeriod = truncated.lastIndexOf('.')
      const lastExclamation = truncated.lastIndexOf('!')
      const lastQuestion = truncated.lastIndexOf('?')
      const lastSentenceEnd = Math.max(
        lastPeriod,
        lastExclamation,
        lastQuestion
      )

      if (lastSentenceEnd > 400) {
        // Only truncate at sentence boundary if we're not losing too much content
        truncated = truncated.substring(0, lastSentenceEnd + 1).trim()
      }
      parsedObj.post = truncated
    }
  }

  const linkedinValidated = LinkedInSchema.parse(linkedinParsed)

  // Generate Facebook
  const facebookPrompt = createFacebookPrompt(
    options.title,
    options.excerpt || '',
    bodyText,
    options.canonicalUrl
  )
  const facebookResponse = await generateWithGemini(facebookPrompt)
  const facebookParsed = parseGeminiJson(facebookResponse)

  // Safety net: Truncate at sentence boundary if AI exceeds limits
  if (typeof facebookParsed === 'object' && facebookParsed !== null) {
    const parsedObj = facebookParsed as Record<string, unknown>
    if (typeof parsedObj.post === 'string' && parsedObj.post.length > 300) {
      // Truncate at the last complete sentence before the limit
      let truncated = parsedObj.post.substring(0, 300).trim()
      const lastPeriod = truncated.lastIndexOf('.')
      const lastExclamation = truncated.lastIndexOf('!')
      const lastQuestion = truncated.lastIndexOf('?')
      const lastSentenceEnd = Math.max(
        lastPeriod,
        lastExclamation,
        lastQuestion
      )

      if (lastSentenceEnd > 250) {
        // Only truncate at sentence boundary if we're not losing too much content
        truncated = truncated.substring(0, lastSentenceEnd + 1).trim()
      }
      parsedObj.post = truncated
    }
  }

  const facebookValidated = FacebookSchema.parse(facebookParsed)

  // Generate Instagram
  const instagramPrompt = createInstagramPrompt(
    options.title,
    options.excerpt || '',
    bodyText,
    options.canonicalUrl
  )
  const instagramResponse = await generateWithGemini(instagramPrompt)
  const instagramParsed = parseGeminiJson(instagramResponse)

  // Safety net: Truncate at sentence boundary if AI exceeds limits
  if (typeof instagramParsed === 'object' && instagramParsed !== null) {
    const parsedObj = instagramParsed as Record<string, unknown>
    if (
      typeof parsedObj.caption === 'string' &&
      parsedObj.caption.length > 300
    ) {
      // Truncate at the last complete sentence before the limit
      let truncated = parsedObj.caption.substring(0, 300).trim()
      const lastPeriod = truncated.lastIndexOf('.')
      const lastExclamation = truncated.lastIndexOf('!')
      const lastQuestion = truncated.lastIndexOf('?')
      const lastSentenceEnd = Math.max(
        lastPeriod,
        lastExclamation,
        lastQuestion
      )

      if (lastSentenceEnd > 250) {
        // Only truncate at sentence boundary if we're not losing too much content
        truncated = truncated.substring(0, lastSentenceEnd + 1).trim()
      }
      parsedObj.caption = truncated
    }
  }

  const instagramValidated = InstagramSchema.parse(instagramParsed)

  // Format LinkedIn post with URL
  const linkedinPost = `${linkedinValidated.post}\n\n${options.canonicalUrl}`

  return {
    linkedin: {
      text: linkedinPost,
    },
    facebook: {
      text: facebookValidated.post,
    },
    instagram: {
      caption: instagramValidated.caption,
      hashtags: instagramValidated.hashtags,
    },
    suggestedFirstComment: instagramValidated.suggestedFirstComment,
  }
}

/**
 * Generate Medium-ready article content
 */
export async function generateMedium(
  options: GenerateOptions & { tags?: string[] }
): Promise<MediumOutput> {
  const rateLimitKey = `medium:${options.postId}`
  if (!checkRateLimit(rateLimitKey)) {
    throw new Error(
      'Rate limit exceeded. Please wait a minute before regenerating.'
    )
  }

  const bodyText = portableTextToPlainText(options.body as never)
  const prompt = createMediumPrompt(
    options.title,
    options.excerpt || '',
    bodyText,
    options.canonicalUrl,
    options.tags || []
  )

  const response = await generateWithGemini(prompt)
  const parsed = parseGeminiJson(response)
  const validated = mediumSchema.parse(parsed)

  return validated
}
