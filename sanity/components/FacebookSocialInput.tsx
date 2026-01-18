'use client'

import { useState, useEffect } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import { ObjectInputProps, useFormValue, PatchEvent, set } from 'sanity'
import {
  generateFacebookDraft,
  checkRateLimitStatus,
} from '../plugins/distribution/actions'

interface GenerateResponse {
  success: boolean
  generated?: {
    social?: {
      facebook?: {
        text?: unknown[] // Portable Text blocks
      }
    }
  }
  error?: string
  rateLimitRemainingMs?: number
  rateLimitType?: string
}

export function FacebookSocialInput(props: ObjectInputProps) {
  const { onChange } = props
  const postId = useFormValue(['_id']) as string | undefined
  const facebookText = useFormValue([
    'distribution',
    'social',
    'facebook',
    'text',
  ]) as unknown[] | undefined
  const generatedAt = useFormValue([
    'distribution',
    'social',
    'generatedAt',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)

  // Determine status based on content (now Portable Text array)
  const status = facebookText && facebookText.length > 0 ? 'ready' : 'idle'

  // Check rate limit status on mount and poll every second
  useEffect(() => {
    if (!postId) return

    const checkRateLimit = async () => {
      const status = await checkRateLimitStatus(postId, 'facebook')
      if (status.rateLimited) {
        const seconds = Math.ceil(status.remainingMs / 1000)
        setRateLimitRemainingSeconds(seconds)
      } else {
        setRateLimitRemainingSeconds(0)
      }
    }

    // Check immediately
    checkRateLimit()

    // Poll every second
    const interval = setInterval(checkRateLimit, 1000)

    return () => clearInterval(interval)
  }, [postId])

  // Format generatedAt date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const handleGenerate = async () => {
    if (!postId) {
      setError('Post information is missing. Please refresh the page.')
      return
    }

    // Check rate limit before attempting generation
    const status = await checkRateLimitStatus(postId, 'facebook')
    if (status.rateLimited) {
      const seconds = Math.ceil(status.remainingMs / 1000)
      setRateLimitRemainingSeconds(seconds)
      setError(
        `Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before generating again.`
      )
      return
    }

    setIsGenerating(true)
    setError(null)
    try {
      const result = (await generateFacebookDraft(postId)) as GenerateResponse
      if (!result.success) {
        // Handle rate limit errors with countdown
        if (result.rateLimitRemainingMs !== undefined) {
          const seconds = Math.ceil(result.rateLimitRemainingMs / 1000)
          setRateLimitRemainingSeconds(seconds)
          setError(
            result.error ||
              `Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before generating again.`
          )
        } else {
          // Handle other errors with better messages
          const errorMessage =
            result.error || 'Generation failed. Please try again in a moment.'
          setError(errorMessage)
        }
        return
      }

      // Update local form state with generated text
      const generatedText = result.generated?.social?.facebook?.text
      if (generatedText) {
        onChange(PatchEvent.from(set(generatedText, ['text'])))
      }
    } catch (err) {
      // Handle network and other errors
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          setError(
            'Unable to connect. Please check your connection and try again.'
          )
        } else {
          setError(
            err.message || 'Generation failed. Please try again in a moment.'
          )
        }
      } else {
        setError('Generation failed. Please try again in a moment.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            Facebook
          </Text>
          <Flex align="center" gap={2}>
            {!isGenerating && (
              <Badge tone={status === 'ready' ? 'caution' : 'primary'}>
                {status}
              </Badge>
            )}
            <Button
              type="button"
              text={
                isGenerating
                  ? 'Generating...'
                  : rateLimitRemainingSeconds > 0
                    ? `Generate Facebook Draft (${rateLimitRemainingSeconds}s)`
                    : 'Generate Facebook Draft'
              }
              mode="ghost"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={handleGenerate}
              disabled={
                isGenerating || !postId || rateLimitRemainingSeconds > 0
              }
            />
          </Flex>
        </Flex>

        {error && (
          <Card
            padding={2}
            radius={2}
            tone={rateLimitRemainingSeconds > 0 ? 'caution' : 'critical'}
          >
            <Text
              size={0}
              style={{
                color: rateLimitRemainingSeconds > 0 ? '#f59e0b' : '#ef4444',
              }}
            >
              {error}
            </Text>
          </Card>
        )}

        {/* Render all fields using Sanity's default rendering */}
        {props.renderDefault(props)}

        {/* Display generated date */}
        {generatedAt && (
          <Flex justify="flex-end">
            <Text size={0} muted>
              Generated: {formatDate(generatedAt)}
            </Text>
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
