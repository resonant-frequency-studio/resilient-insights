'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  TextArea,
} from '@sanity/ui'
import { PortableTextBlock } from '@sanity/types'
import {
  checkRateLimitStatus,
  generateNewsletterDraft,
} from '../../distribution/actions'
import {
  plainTextToPortableText,
  portableTextToPlainTextString,
} from '@/lib/sanity/portableTextConverter'
import { portableTextToMarkdown } from '@/lib/sanity/portableText'

interface NewsletterData {
  title?: string
  subtitle?: string
  body?: PortableTextBlock[]
  ctaText?: string
  ctaUrl?: string
  generatedAt?: string
  model?: string
}

interface StandaloneNewsletterEditorProps {
  postId: string
  newsletter?: Record<string, unknown>
  onSave: (path: string[], value: unknown) => Promise<void>
  onRefresh: () => Promise<void>
}

export function StandaloneNewsletterEditor({
  postId,
  newsletter,
  onSave,
  onRefresh,
}: StandaloneNewsletterEditorProps) {
  const data = useMemo(() => (newsletter || {}) as NewsletterData, [newsletter])
  const [title, setTitle] = useState(data.title || '')
  const [subtitle, setSubtitle] = useState(data.subtitle || '')
  const [bodyText, setBodyText] = useState(
    portableTextToPlainTextString(data.body)
  )
  const [ctaText, setCtaText] = useState(data.ctaText || '')
  const [ctaUrl, setCtaUrl] = useState(data.ctaUrl || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(data.title || '')
    setSubtitle(data.subtitle || '')
    setBodyText(portableTextToPlainTextString(data.body))
    setCtaText(data.ctaText || '')
    setCtaUrl(data.ctaUrl || '')
  }, [data])

  const status = bodyText.trim().length > 0 ? 'ready' : 'idle'

  const handleGenerate = useCallback(async () => {
    if (!postId) {
      setError('Post information is missing. Please select a post.')
      return
    }

    const status = await checkRateLimitStatus(postId, 'newsletter')
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
      const result = (await generateNewsletterDraft(postId)) as {
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
      const status = await checkRateLimitStatus(postId, 'newsletter')
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
      const nextNewsletter: NewsletterData = {
        ...data,
        title: title.trim(),
        subtitle: subtitle.trim(),
        body: plainTextToPortableText(bodyText),
        ctaText: ctaText.trim(),
        ctaUrl: ctaUrl.trim(),
      }
      await onSave(['distribution', 'newsletter'], nextNewsletter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }, [bodyText, ctaText, ctaUrl, data, onSave, subtitle, title])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCopyBody = useCallback(() => {
    const markdown = portableTextToMarkdown(plainTextToPortableText(bodyText))
    navigator.clipboard.writeText(markdown)
  }, [bodyText])

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            Newsletter Draft
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
                    : 'Generate Newsletter'
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
          <Button
            text="Copy Title"
            mode="ghost"
            fontSize={0}
            padding={1}
            onClick={() => copyToClipboard(title)}
            disabled={!title}
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
          <Button
            text="Copy Subtitle"
            mode="ghost"
            fontSize={0}
            padding={1}
            onClick={() => copyToClipboard(subtitle)}
            disabled={!subtitle}
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
          <Button
            text="Copy Body (Markdown)"
            mode="ghost"
            fontSize={0}
            padding={1}
            onClick={handleCopyBody}
            disabled={!bodyText.trim()}
          />
        </Stack>

        <Stack space={2}>
          <Text size={0} muted>
            CTA Text
          </Text>
          <TextInput
            value={ctaText}
            onChange={e => setCtaText(e.currentTarget.value)}
          />
          <Button
            text="Copy CTA Text"
            mode="ghost"
            fontSize={0}
            padding={1}
            onClick={() => copyToClipboard(ctaText)}
            disabled={!ctaText}
          />
        </Stack>

        <Stack space={2}>
          <Text size={0} muted>
            CTA URL
          </Text>
          <TextInput
            value={ctaUrl}
            onChange={e => setCtaUrl(e.currentTarget.value)}
          />
          <Button
            text="Copy CTA URL"
            mode="ghost"
            fontSize={0}
            padding={1}
            onClick={() => copyToClipboard(ctaUrl)}
            disabled={!ctaUrl}
          />
        </Stack>

        <Flex justify="space-between" align="center">
          <Text size={0} muted>
            {data.generatedAt
              ? `Generated: ${new Date(data.generatedAt).toLocaleString()}`
              : 'Not generated yet'}
          </Text>
          <Button
            text={isSaving ? 'Saving...' : 'Save Newsletter'}
            tone="primary"
            onClick={handleSave}
            disabled={isSaving}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
