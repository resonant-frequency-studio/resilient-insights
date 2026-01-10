'use client'

import { useState, useMemo } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import { ObjectInputProps, useFormValue, PatchEvent, set } from 'sanity'
import {
  generateLinkedInDraft,
  schedulePost,
} from '../plugins/distribution/actions'
import { ScheduleModal } from './ScheduleModal'
import { portableTextToPlainText } from '@/lib/sanity/portableText'
import { PortableTextBlock } from '@sanity/types'
import { getNextOptimalTimes } from '@/lib/scheduler/recommendations'

interface GenerateResponse {
  success: boolean
  generated?: {
    social?: {
      linkedin?: {
        text?: unknown[] // Portable Text blocks
      }
    }
  }
  error?: string
}

export function LinkedInSocialInput(props: ObjectInputProps) {
  const { onChange } = props
  const postId = useFormValue(['_id']) as string | undefined
  const linkedInText = useFormValue([
    'distribution',
    'social',
    'linkedin',
    'text',
  ]) as unknown[] | undefined
  const generatedAt = useFormValue([
    'distribution',
    'social',
    'generatedAt',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Determine status based on content (now Portable Text array)
  const status = linkedInText && linkedInText.length > 0 ? 'ready' : 'idle'

  // Get recommended posting times for LinkedIn
  const recommendations = useMemo(() => {
    const times = getNextOptimalTimes('linkedin', new Date(), 5)
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
      setError('Post ID not found')
      return
    }
    setIsGenerating(true)
    setError(null)
    setSuccess(null)
    try {
      const result = (await generateLinkedInDraft(postId)) as GenerateResponse
      if (!result.success) {
        setError(result.error || 'Generation failed')
        return
      }

      // Update local form state with generated text
      const generatedText = result.generated?.social?.linkedin?.text
      if (generatedText) {
        onChange(PatchEvent.from(set(generatedText, ['text'])))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSchedule = async (scheduledAt: string) => {
    if (!postId || !linkedInText) {
      setError('Post ID or content not found')
      return
    }

    setIsScheduling(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert Portable Text to plain text for scheduling (LinkedIn doesn't support Markdown)
      const content = portableTextToPlainText(
        linkedInText as PortableTextBlock[]
      )

      const result = await schedulePost(
        postId,
        'linkedin',
        content,
        scheduledAt
      )

      if (!result.success) {
        setError(result.error || 'Scheduling failed')
        return
      }

      setSuccess(
        `LinkedIn post scheduled for ${new Date(scheduledAt).toLocaleString()}`
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
            LinkedIn
          </Text>
          <Flex align="center" gap={2}>
            {!isGenerating && (
              <Badge tone={status === 'ready' ? 'caution' : 'primary'}>
                {status}
              </Badge>
            )}
            <Button
              type="button"
              text={isGenerating ? 'Generating...' : 'Generate LinkedIn Draft'}
              mode="ghost"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={handleGenerate}
              disabled={isGenerating || !postId}
            />
          </Flex>
        </Flex>

        {/* Schedule Button - Only show when content exists */}
        {status === 'ready' && (
          <Flex justify="flex-end">
            <Button
              type="button"
              text="Schedule LinkedIn Post"
              tone="positive"
              mode="ghost"
              fontSize={0}
              padding={2}
              onClick={() => setShowScheduleModal(true)}
              disabled={isScheduling}
            />
          </Flex>
        )}

        {error && (
          <Text size={0} style={{ color: 'red' }}>
            {error}
          </Text>
        )}

        {success && (
          <Text size={0} style={{ color: 'green' }}>
            {success}
          </Text>
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

        {/* Schedule Modal */}
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleSchedule}
          channel="linkedin"
          recommendations={recommendations}
          loading={isScheduling}
        />
      </Stack>
    </Card>
  )
}
