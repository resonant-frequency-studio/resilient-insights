'use client'

import { useState } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import { ObjectInputProps, useFormValue, PatchEvent, set } from 'sanity'
import { PortableTextBlock } from '@sanity/types'
import { publishToMedium } from '../plugins/distribution/actions'
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
}

export function MediumInput(props: ObjectInputProps) {
  const postId = useFormValue(['_id']) as string | undefined
  const mediumContent = useFormValue(['distribution', 'medium', 'body']) as
    | PortableTextBlock[]
    | undefined
  const mediumStatus = useFormValue(['distribution', 'medium', 'status']) as
    | string
    | undefined
  const generatedAt = useFormValue([
    'distribution',
    'medium',
    'generatedAt',
  ]) as string | undefined
  const storedError = useFormValue(['distribution', 'medium', 'error']) as
    | string
    | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!postId) {
      setError('Post ID not found')
      return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const result = (await publishToMedium(postId)) as GenerateResponse
      if (!result.success) {
        setError(result.error || 'Generation failed')
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
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyContentAsMarkdown = () => {
    if (mediumContent) {
      const markdown = portableTextToMarkdown(mediumContent)
      navigator.clipboard.writeText(markdown)
    }
  }

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

  // Combine local error state with stored error
  const displayError = error || storedError

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
              text={isGenerating ? 'Generating...' : 'Generate Medium Draft'}
              mode="ghost"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={handleGenerate}
              disabled={isGenerating || !postId}
            />
          </Flex>
        </Flex>

        {/* Display error as text */}
        {displayError && (
          <Text size={0} style={{ color: '#f03e3e' }}>
            Error: {displayError}
          </Text>
        )}

        {/* Use Sanity's default rendering - handles all field updates properly */}
        {props.renderDefault(props)}

        {/* Footer with copy button and generated date */}
        {generatedAt && (
          <Flex align="center" justify="space-between">
            <Stack space={2}>
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
            </Stack>
            <Text size={0} muted>
              Generated: {formatDate(generatedAt)}
            </Text>
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
