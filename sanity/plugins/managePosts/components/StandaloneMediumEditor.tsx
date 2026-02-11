'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  TextArea,
  Badge,
} from '@sanity/ui'
import { PortableTextBlock } from '@sanity/types'
import {
  checkRateLimitStatus,
  generateMediumDraft,
} from '../../distribution/actions'
import {
  plainTextToPortableText,
  portableTextToPlainTextString,
} from '@/lib/sanity/portableTextConverter'

interface MediumData {
  title?: string
  subtitle?: string
  body?: PortableTextBlock[]
  tags?: string[]
  status?: 'idle' | 'ready' | 'error'
  generatedAt?: string
  error?: string
}

interface StandaloneMediumEditorProps {
  postId: string
  medium?: Record<string, unknown>
  onSave: (path: string[], value: unknown) => Promise<void>
  onRefresh: () => Promise<void>
}

export function StandaloneMediumEditor({
  postId,
  medium,
  onSave,
  onRefresh,
}: StandaloneMediumEditorProps) {
  const data = useMemo(() => (medium || {}) as MediumData, [medium])
  const [title, setTitle] = useState(data.title || '')
  const [subtitle, setSubtitle] = useState(data.subtitle || '')
  const [bodyText, setBodyText] = useState(
    portableTextToPlainTextString(data.body)
  )
  const [tagsText, setTagsText] = useState((data.tags || []).join(', '))
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(data.title || '')
    setSubtitle(data.subtitle || '')
    setBodyText(portableTextToPlainTextString(data.body))
    setTagsText((data.tags || []).join(', '))
  }, [data])

  const handleGenerate = useCallback(async () => {
    if (!postId) {
      setError('Post information is missing. Please select a post.')
      return
    }

    const status = await checkRateLimitStatus(postId, 'medium')
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
      const result = (await generateMediumDraft(postId)) as {
        success: boolean
        error?: string
      }
      if (!result.success) {
        setError(result.error || 'Generation failed. Please try again.')
        return
      }
      await onRefresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Generation failed. Please try again.'
      )
    } finally {
      setIsGenerating(false)
    }
  }, [onRefresh, postId])

  useEffect(() => {
    if (!postId) return

    const checkRateLimit = async () => {
      const status = await checkRateLimitStatus(postId, 'medium')
      if (status.rateLimited) {
        setRateLimitRemainingSeconds(Math.ceil(status.remainingMs / 1000))
      } else {
        setRateLimitRemainingSeconds(0)
      }
    }

    checkRateLimit()
    const interval = setInterval(checkRateLimit, 1000)
    return () => clearInterval(interval)
  }, [postId])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const tags = tagsText
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      const nextMedium: MediumData = {
        ...data,
        title: title.trim(),
        subtitle: subtitle.trim(),
        body: plainTextToPortableText(bodyText),
        tags,
      }
      await onSave(['distribution', 'medium'], nextMedium)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }, [bodyText, data, onSave, subtitle, tagsText, title])

  const status = data.status || (bodyText.trim() ? 'ready' : 'idle')

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            Medium Draft
          </Text>
          <Flex align="center" gap={2}>
            {!isGenerating && (
              <Badge tone={status === 'ready' ? 'caution' : 'primary'}>
                {status}
              </Badge>
            )}
            <Button
              text={
                isGenerating
                  ? 'Generating...'
                  : rateLimitRemainingSeconds > 0
                    ? `Generate (${rateLimitRemainingSeconds}s)`
                    : 'Generate Medium Draft'
              }
              mode="ghost"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={handleGenerate}
              disabled={isGenerating || rateLimitRemainingSeconds > 0}
            />
          </Flex>
        </Flex>

        {error && (
          <Card padding={2} radius={2} tone="critical">
            <Text size={0}>{error}</Text>
          </Card>
        )}

        <Stack space={2}>
          <Text size={0} muted>
            Title
          </Text>
          <TextInput
            value={title}
            onChange={e => setTitle(e.currentTarget.value)}
          />
        </Stack>

        <Stack space={2}>
          <Text size={0} muted>
            Subtitle
          </Text>
          <TextInput
            value={subtitle}
            onChange={e => setSubtitle(e.currentTarget.value)}
          />
        </Stack>

        <Stack space={2}>
          <Text size={0} muted>
            Body
          </Text>
          <TextArea
            value={bodyText}
            onChange={e => setBodyText(e.currentTarget.value)}
            rows={8}
          />
        </Stack>

        <Stack space={2}>
          <Text size={0} muted>
            Tags (comma separated)
          </Text>
          <TextInput
            value={tagsText}
            onChange={e => setTagsText(e.currentTarget.value)}
          />
        </Stack>

        <Flex justify="space-between" align="center">
          <Text size={0} muted>
            {data.generatedAt
              ? `Generated: ${new Date(data.generatedAt).toLocaleString()}`
              : 'Not generated yet'}
          </Text>
          <Button
            text={isSaving ? 'Saving...' : 'Save Medium Draft'}
            tone="primary"
            onClick={handleSave}
            disabled={isSaving}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
