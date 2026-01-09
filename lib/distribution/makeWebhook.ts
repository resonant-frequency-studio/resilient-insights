/**
 * Make.com webhook client
 * Sends structured payloads to Make.com webhook for processing
 *
 * @deprecated This module is deprecated. Social media scheduling now uses direct platform APIs via Inngest.
 * This file is kept for backward compatibility but should not be used in new code.
 */

export interface MakeWebhookPayload {
  articleId: string
  canonicalUrl: string
  channels: {
    linkedin?: {
      text: string
      scheduledAt?: string // ISO 8601
    }
    facebook?: {
      text: string
      scheduledAt?: string
    }
    instagram?: {
      text: string
      hashtags: string[]
      suggestedFirstComment?: string
      scheduledAt?: string
    }
  }
  metadata?: {
    title: string
    excerpt?: string
    generatedAt: string
  }
}

export interface MakeWebhookResponse {
  success: boolean
  jobId?: string
  error?: string
  statusCode?: number
}

/**
 * Send payload to Make.com webhook
 * @param payload - Structured payload for Make.com
 * @param webhookUrl - Make.com webhook URL
 * @param secret - Bearer token or secret for authentication
 * @returns Response from Make.com
 */
export async function sendToMake(
  payload: MakeWebhookPayload,
  webhookUrl?: string,
  secret?: string
): Promise<MakeWebhookResponse> {
  const url = webhookUrl || process.env.MAKE_WEBHOOK_URL
  const authSecret = secret || process.env.MAKE_WEBHOOK_SECRET

  if (!url) {
    throw new Error('MAKE_WEBHOOK_URL is required')
  }

  if (!authSecret) {
    throw new Error('MAKE_WEBHOOK_SECRET is required for authentication')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-make-apikey': authSecret,
  }

  let retries = 3
  let lastError: Error | null = null

  while (retries > 0) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        return {
          success: true,
          jobId: data.jobId || data.id || undefined,
          statusCode: response.status,
        }
      }

      // Non-2xx response
      const errorText = await response.text().catch(() => 'Unknown error')
      lastError = new Error(
        `Make webhook error: ${response.status} ${errorText}`
      )

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: lastError.message,
          statusCode: response.status,
        }
      }

      // Retry on 5xx errors
      retries--
      if (retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000 // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      retries--
      if (retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Make webhook request failed after retries',
  }
}
