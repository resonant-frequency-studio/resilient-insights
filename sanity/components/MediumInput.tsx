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
  generateMediumDraft,
  checkRateLimitStatus,
} from '../plugins/distribution/actions'
import { portableTextToMarkdown } from '@/lib/sanity/portableText'

interface GenerateResponse {
  success: boolean
  data?: {
    title?: string
    subtitle?: string
    body?: PortableTextBlock[]
    tags?: string[]
    generatedAt?: string
  }
  error?: string
  rateLimitRemainingMs?: number
  rateLimitType?: string
}

export function MediumInput(props: ObjectInputProps) {
  // Get the referenced post ID (postDistribution has a post reference)
  const postRef = useFormValue(['post', '_ref']) as string | undefined
  const documentId = useFormValue(['_id']) as string | undefined
  // Use the post reference for API calls, fall back to document ID for legacy support
  const postId = postRef || documentId
  // Fields are now at root level of postDistribution document
  const mediumTitle = useFormValue(['medium', 'title']) as string | undefined
  const mediumSubtitle = useFormValue(['medium', 'subtitle']) as
    | string
    | undefined
  const mediumContent = useFormValue(['medium', 'body']) as
    | PortableTextBlock[]
    | undefined
  const mediumTags = useFormValue(['medium', 'tags']) as string[] | undefined
  const mediumStatus = useFormValue(['medium', 'status']) as string | undefined
  const generatedAt = useFormValue(['medium', 'generatedAt']) as
    | string
    | undefined
  const storedError = useFormValue(['medium', 'error']) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)

  const handleGenerate = async () => {
    if (!postId) {
      setError('Post information is missing. Please refresh the page.')
      return
    }

    // Check rate limit before attempting generation
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
      const result = (await generateMediumDraft(postId)) as GenerateResponse
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
      const medium = result.data
      if (medium) {
        const patches = []
        if (medium.title) patches.push(set(medium.title, ['title']))
        if (medium.subtitle) patches.push(set(medium.subtitle, ['subtitle']))
        if (medium.body) patches.push(set(medium.body, ['body']))
        if (medium.tags) patches.push(set(medium.tags, ['tags']))
        patches.push(set('ready', ['status']))
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

  const copyContentAsMarkdown = useCallback(() => {
    if (mediumContent) {
      const markdown = portableTextToMarkdown(mediumContent)
      navigator.clipboard.writeText(markdown)
    }
  }, [mediumContent])

  const copyTagsAsCommaSeparated = useCallback(() => {
    if (mediumTags && mediumTags.length > 0) {
      navigator.clipboard.writeText(mediumTags.join(', '))
    }
  }, [mediumTags])

  // Get status badge color
  const getStatusTone = () => {
    if (isGenerating) return 'default'
    switch (mediumStatus) {
      case 'ready':
        return 'caution'
      case 'error':
        return 'critical'
      default:
        return 'primary'
    }
  }

  // Format generatedAt date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  // Check rate limit status on mount and poll every second
  useEffect(() => {
    if (!postId) return

    const checkRateLimit = async () => {
      const status = await checkRateLimitStatus(postId, 'medium')
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

  // Combine local error state with stored error
  const displayError = error || storedError

  // Destructure renderField for useCallback dependency
  const { renderField } = props

  // Custom renderField that adds copy buttons after each field
  const customRenderField = useCallback(
    (fieldProps: Omit<FieldProps, 'renderDefault'>) => {
      const fieldName = fieldProps.name
      const renderedField = renderField(fieldProps)

      // Get copy button config for this field
      let copyButton = null

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
                onClick={() => copyToClipboard(mediumTitle || '')}
                disabled={!mediumTitle}
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
                onClick={() => copyToClipboard(mediumSubtitle || '')}
                disabled={!mediumSubtitle}
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
                onClick={copyContentAsMarkdown}
                disabled={!mediumContent || mediumContent.length === 0}
              />
            </Flex>
          )
          break
        case 'tags':
          copyButton = (
            <Flex justify="flex-start">
              <Button
                type="button"
                text="Copy Tags"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={copyTagsAsCommaSeparated}
                disabled={!mediumTags || mediumTags.length === 0}
              />
            </Flex>
          )
          break
      }

      if (copyButton) {
        return (
          <Stack space={2}>
            {renderedField}
            {copyButton}
          </Stack>
        )
      }

      return renderedField
    },
    [
      renderField,
      mediumTitle,
      mediumSubtitle,
      mediumContent,
      mediumTags,
      copyContentAsMarkdown,
      copyTagsAsCommaSeparated,
    ]
  )

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            Medium Draft
          </Text>
          <Flex align="center" gap={2}>
            {!isGenerating && (
              <Badge tone={getStatusTone()}>{mediumStatus || 'idle'}</Badge>
            )}
            <Button
              type="button"
              text={
                isGenerating
                  ? 'Generating...'
                  : rateLimitRemainingSeconds > 0
                    ? `Generate Medium Draft (${rateLimitRemainingSeconds}s)`
                    : 'Generate Medium Draft'
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

        {/* Display error with better styling */}
        {displayError && (
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
              {displayError}
            </Text>
          </Card>
        )}

        {/* Use Sanity's renderDefault with custom renderField for copy buttons */}
        {props.renderDefault({
          ...props,
          renderField: customRenderField,
        })}

        {/* Footer with Medium link and generated date */}
        {generatedAt && (
          <Flex align="center" justify="space-between">
            <Text size={0} muted>
              After copying, go to{' '}
              <a
                href="https://medium.com/new-story"
                target="_blank"
                rel="noopener noreferrer"
              >
                Medium&apos;s new story page
              </a>{' '}
              and paste the content.
            </Text>
            <Text size={0} muted>
              Generated: {formatDate(generatedAt)}
            </Text>
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
