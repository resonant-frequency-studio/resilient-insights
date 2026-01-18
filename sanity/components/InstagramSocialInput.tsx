'use client'

import { useState, useEffect } from 'react'
import {
  Stack,
  Text,
  Button,
  Flex,
  Card,
  Badge,
  Label,
  TextArea,
} from '@sanity/ui'
import { ObjectInputProps, useFormValue, PatchEvent, set } from 'sanity'
import {
  generateInstagramDraft,
  checkRateLimitStatus,
} from '../plugins/distribution/actions'

interface GenerateResponse {
  success: boolean
  generated?: {
    social?: {
      instagram?: {
        caption?: unknown[] // Portable Text blocks
        hashtags?: string[]
      }
      suggestedFirstComment?: string
    }
  }
  error?: string
  rateLimitRemainingMs?: number
  rateLimitType?: string
}

export function InstagramSocialInput(props: ObjectInputProps) {
  const { onChange } = props
  const postId = useFormValue(['_id']) as string | undefined
  const instagramCaption = useFormValue([
    'distribution',
    'social',
    'instagram',
    'caption',
  ]) as unknown[] | undefined
  const generatedAt = useFormValue([
    'distribution',
    'social',
    'generatedAt',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)

  // Read suggested first comment from parent social object
  const suggestedFirstComment = useFormValue([
    'distribution',
    'social',
    'suggestedFirstComment',
  ]) as string | undefined

  // Determine status based on content (now Portable Text array)
  const status =
    instagramCaption && instagramCaption.length > 0 ? 'ready' : 'idle'

  // Check rate limit status on mount and poll every second
  useEffect(() => {
    if (!postId) return

    const checkRateLimit = async () => {
      const status = await checkRateLimitStatus(postId, 'instagram')
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
    const status = await checkRateLimitStatus(postId, 'instagram')
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
      const result = (await generateInstagramDraft(postId)) as GenerateResponse
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

      // Update local form state with generated content
      const instagram = result.generated?.social?.instagram
      if (instagram?.caption) {
        onChange(PatchEvent.from(set(instagram.caption, ['caption'])))
      }
      if (instagram?.hashtags) {
        onChange(PatchEvent.from(set(instagram.hashtags, ['hashtags'])))
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
            Instagram
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
                    ? `Generate Instagram Draft (${rateLimitRemainingSeconds}s)`
                    : 'Generate Instagram Draft'
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

        {/* Render suggested first comment - reads from parent social object */}
        <Stack space={2}>
          <Label>Suggested First Comment</Label>
          <TextArea
            value={suggestedFirstComment || ''}
            onChange={e => {
              // Patch at the social level path
              const event = PatchEvent.from(
                set(e.currentTarget.value, [
                  'distribution',
                  'social',
                  'suggestedFirstComment',
                ])
              )
              props.onChange(event)
            }}
            rows={3}
          />
        </Stack>

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
