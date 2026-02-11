'use client'

import { useState, useMemo, useEffect } from 'react'
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
  schedulePost,
  checkRateLimitStatus,
} from '../plugins/distribution/actions'
import { ScheduleModal } from './ScheduleModal'
import { portableTextToPlainText } from '@/lib/sanity/portableText'
import { PortableTextBlock } from '@sanity/types'
import { getNextOptimalTimes } from '@/lib/scheduler/recommendations'
import { SanityImageReference } from '@/lib/social/imageOptimizer'

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
  // Get the referenced post ID (postDistribution has a post reference)
  const postRef = useFormValue(['post', '_ref']) as string | undefined
  const documentId = useFormValue(['_id']) as string | undefined
  // Use the post reference for API calls, fall back to document ID for legacy support
  const postId = postRef || documentId
  // Fields are now at root level of postDistribution document
  const instagramCaption = useFormValue(['social', 'instagram', 'caption']) as
    | unknown[]
    | undefined
  const generatedAt = useFormValue(['social', 'generatedAt']) as
    | string
    | undefined
  const instagramImage = useFormValue(['social', 'instagram', 'image']) as
    | SanityImageReference
    | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)

  // Read suggested first comment from parent social object
  const suggestedFirstComment = useFormValue([
    'social',
    'suggestedFirstComment',
  ]) as string | undefined

  // Determine status based on content (now Portable Text array)
  const status =
    instagramCaption && instagramCaption.length > 0 ? 'ready' : 'idle'

  // Convert Portable Text to plain text for preview
  const previewText = useMemo(() => {
    if (!instagramCaption || instagramCaption.length === 0) return ''
    return portableTextToPlainText(instagramCaption as PortableTextBlock[])
  }, [instagramCaption])

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

  // Get recommended posting times for Instagram
  const recommendations = useMemo(() => {
    const times = getNextOptimalTimes('instagram', new Date(), 5)
    return times.map(date => date.toISOString())
  }, [])

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
    setSuccess(null)
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

  const handleSchedule = async (scheduledAt: string) => {
    if (!postId || !instagramCaption) {
      setError('Post ID or content not found')
      return
    }

    setIsScheduling(true)
    setError(null)
    setSuccess(null)

    try {
      const content = portableTextToPlainText(
        instagramCaption as PortableTextBlock[]
      )

      const result = await schedulePost(
        postId,
        'instagram',
        content,
        scheduledAt
      )

      if (!result.success) {
        setError(result.error || 'Scheduling failed')
        return
      }

      setSuccess(
        `Instagram post scheduled for ${new Date(scheduledAt).toLocaleString()}`
      )
      setShowScheduleModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsScheduling(false)
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
              fontSize={1}
              padding={3}
              onClick={handleGenerate}
              disabled={
                isGenerating || !postId || rateLimitRemainingSeconds > 0
              }
            />
          </Flex>
        </Flex>

        {/* Schedule Button - Only show when content exists */}
        {status === 'ready' && (
          <Flex justify="flex-end">
            <Button
              type="button"
              text="Schedule Instagram Post"
              tone="positive"
              mode="ghost"
              fontSize={1}
              padding={3}
              onClick={() => setShowScheduleModal(true)}
              disabled={isScheduling}
            />
          </Flex>
        )}

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

        {success && (
          <Card padding={2} radius={2} tone="positive">
            <Text size={0} style={{ color: '#10b981' }}>
              {success}
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

        {/* Schedule Modal */}
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleSchedule}
          channel="instagram"
          recommendations={recommendations}
          loading={isScheduling}
          image={instagramImage}
          textContent={previewText}
        />
      </Stack>
    </Card>
  )
}
