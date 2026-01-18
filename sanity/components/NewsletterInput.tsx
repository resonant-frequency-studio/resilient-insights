'use client'

import { useState, useCallback, useEffect } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  useFormValue,
  PatchEvent,
  set,
  FieldProps,
} from 'sanity'
import { PortableTextBlock } from '@sanity/types'
import {
  generateNewsletterDraft,
  checkRateLimitStatus,
} from '../plugins/distribution/actions'
import { portableTextToMarkdown } from '@/lib/sanity/portableText'

interface GenerateResponse {
  success: boolean
  generated?: {
    newsletter?: {
      title?: string
      subtitle?: string
      body?: PortableTextBlock[]
      ctaText?: string
      ctaUrl?: string
      generatedAt?: string
      model?: string
    }
  }
  error?: string
  rateLimitRemainingMs?: number
  rateLimitType?: string
}

export function NewsletterInput(props: ObjectInputProps) {
  const postId = useFormValue(['_id']) as string | undefined
  const newsletterTitle = useFormValue([
    'distribution',
    'newsletter',
    'title',
  ]) as string | undefined
  const newsletterSubtitle = useFormValue([
    'distribution',
    'newsletter',
    'subtitle',
  ]) as string | undefined
  const newsletterBody = useFormValue([
    'distribution',
    'newsletter',
    'body',
  ]) as PortableTextBlock[] | undefined
  const newsletterCtaText = useFormValue([
    'distribution',
    'newsletter',
    'ctaText',
  ]) as string | undefined
  const newsletterCtaUrl = useFormValue([
    'distribution',
    'newsletter',
    'ctaUrl',
  ]) as string | undefined
  const generatedAt = useFormValue([
    'distribution',
    'newsletter',
    'generatedAt',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)

  // Determine status based on content
  const status = newsletterBody && newsletterBody.length > 0 ? 'ready' : 'idle'

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
      const result = (await generateNewsletterDraft(postId)) as GenerateResponse
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
      const newsletter = result.generated?.newsletter
      if (newsletter) {
        const patches = []
        if (newsletter.title) patches.push(set(newsletter.title, ['title']))
        if (newsletter.subtitle)
          patches.push(set(newsletter.subtitle, ['subtitle']))
        if (newsletter.body) patches.push(set(newsletter.body, ['body']))
        if (newsletter.ctaText)
          patches.push(set(newsletter.ctaText, ['ctaText']))
        if (newsletter.ctaUrl) patches.push(set(newsletter.ctaUrl, ['ctaUrl']))
        if (patches.length > 0) {
          props.onChange(PatchEvent.from(patches))
        }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyBodyAsMarkdown = useCallback(() => {
    if (newsletterBody) {
      const markdown = portableTextToMarkdown(newsletterBody)
      navigator.clipboard.writeText(markdown)
    }
  }, [newsletterBody])

  // Check rate limit status on mount and poll every second
  useEffect(() => {
    if (!postId) return

    const checkRateLimit = async () => {
      const status = await checkRateLimitStatus(postId, 'newsletter')
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

  // Destructure renderField for useCallback dependency
  const { renderField } = props

  // Custom renderField that adds copy buttons after each field
  const customRenderField = useCallback(
    (fieldProps: Omit<FieldProps, 'renderDefault'>) => {
      const fieldName = fieldProps.name
      const renderedField = renderField(fieldProps)

      // Get copy button config for this field
      let copyButton = null
      let wrapperStyle = {}

      switch (fieldName) {
        case 'title':
          copyButton = (
            <Flex justify="flex-start">
              <Button
                type="button"
                text="Copy Title"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => copyToClipboard(newsletterTitle || '')}
                disabled={!newsletterTitle}
              />
            </Flex>
          )
          break
        case 'subtitle':
          copyButton = (
            <Flex justify="flex-start">
              <Button
                type="button"
                text="Copy Subtitle"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => copyToClipboard(newsletterSubtitle || '')}
                disabled={!newsletterSubtitle}
              />
            </Flex>
          )
          break
        case 'body':
          copyButton = (
            <Flex justify="flex-start">
              <Button
                type="button"
                text="Copy Body (Markdown)"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={copyBodyAsMarkdown}
                disabled={!newsletterBody || newsletterBody.length === 0}
              />
            </Flex>
          )
          break
        case 'ctaText':
          copyButton = (
            <Flex justify="flex-start">
              <Button
                type="button"
                text="Copy CTA Text"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => copyToClipboard(newsletterCtaText || '')}
                disabled={!newsletterCtaText}
              />
            </Flex>
          )
          break
        case 'ctaUrl':
          wrapperStyle = { opacity: 0.6 }
          copyButton = (
            <Flex justify="flex-start" style={{ opacity: 1 }}>
              <Button
                type="button"
                text="Copy CTA URL"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => copyToClipboard(newsletterCtaUrl || '')}
                disabled={!newsletterCtaUrl}
              />
            </Flex>
          )
          break
      }

      if (copyButton) {
        return (
          <Stack space={2} style={wrapperStyle}>
            {renderedField}
            {copyButton}
          </Stack>
        )
      }

      return renderedField
    },
    [
      renderField,
      newsletterTitle,
      newsletterSubtitle,
      newsletterBody,
      newsletterCtaText,
      newsletterCtaUrl,
      copyBodyAsMarkdown,
    ]
  )

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
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
              type="button"
              text={
                isGenerating
                  ? 'Generating...'
                  : rateLimitRemainingSeconds > 0
                    ? `Generate Newsletter Draft (${rateLimitRemainingSeconds}s)`
                    : 'Generate Newsletter Draft'
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

        {/* Use Sanity's renderDefault with custom renderField for copy buttons */}
        {props.renderDefault({
          ...props,
          renderField: customRenderField,
        })}

        {/* Generated date - bottom right */}
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
