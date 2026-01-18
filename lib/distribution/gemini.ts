import { GoogleGenerativeAI } from '@google/generative-ai'
import { logWarn, logError } from '@/lib/utils/logger'

const apiKey = process.env.GOOGLE_GEMINI_API_KEY

// Only warn in development environment
if (!apiKey) {
  logWarn(
    'GOOGLE_GEMINI_API_KEY is not set. Distribution generation will not work.'
  )
}

/**
 * Initialize Gemini client
 */
export function getGeminiClient() {
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is required')
  }
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Generate content using Gemini
 * @param prompt - The prompt to send to Gemini
 * @param model - The model to use (default: gemini-2.5-flash)
 */
export async function generateWithGemini(
  prompt: string,
  model: string = 'gemini-2.5-flash'
): Promise<string> {
  const genAI = getGeminiClient()
  const genModel = genAI.getGenerativeModel({ model })

  try {
    const result = await genModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    logError('Gemini API error:', error)

    // If model not found, try to list available models for debugging
    if (error instanceof Error && error.message.includes('not found')) {
      try {
        const availableModels = await listAvailableModels()
        logError('Available models from API:', availableModels)
        if (availableModels.length > 0) {
          logError('Try using one of these models:', availableModels.join(', '))
        }
      } catch (listError) {
        logError('Could not list models:', listError)
      }
    }

    throw new Error(
      `Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * List available Gemini models by calling the API directly
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return []
    }

    // Call the Google AI API directly to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      logError('Failed to list models:', response.status, response.statusText)
      return []
    }

    const data = await response.json()
    if (data.models && Array.isArray(data.models)) {
      return data.models
        .map((model: { name: string }) => {
          // Extract model name from full path (e.g., "models/gemini-pro" -> "gemini-pro")
          return model.name.replace('models/', '')
        })
        .filter((name: string) => name) // Filter out empty names
    }

    return []
  } catch (error) {
    logError('Error listing models:', error)
    return []
  }
}

/**
 * Rate limiting helper (simple in-memory cache)
 */
const rateLimitCache = new Map<string, number>()
const DEFAULT_RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

export interface RateLimitResult {
  allowed: boolean
  remainingMs?: number
}

export function checkRateLimit(
  key: string,
  windowMs: number = DEFAULT_RATE_LIMIT_WINDOW
): RateLimitResult {
  const now = Date.now()
  const lastRequest = rateLimitCache.get(key)

  if (lastRequest && now - lastRequest < windowMs) {
    const remainingMs = windowMs - (now - lastRequest)
    return { allowed: false, remainingMs }
  }

  rateLimitCache.set(key, now)
  return { allowed: true }
}

/**
 * Get rate limit status without updating the cache
 */
export function getRateLimitStatus(
  key: string,
  windowMs: number = DEFAULT_RATE_LIMIT_WINDOW
): RateLimitResult {
  const now = Date.now()
  const lastRequest = rateLimitCache.get(key)

  if (lastRequest && now - lastRequest < windowMs) {
    const remainingMs = windowMs - (now - lastRequest)
    return { allowed: false, remainingMs }
  }

  return { allowed: true }
}
