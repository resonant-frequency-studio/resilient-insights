'use client'

import { useState } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import { ObjectInputProps, useFormValue, PatchEvent, set } from 'sanity'
import { PortableTextBlock } from '@sanity/types'
import { generateContent } from '../plugins/distribution/actions'
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
}

export function NewsletterInput(props: ObjectInputProps) {
  const postId = useFormValue(['_id']) as string | undefined
  const newsletterBody = useFormValue([
    'distribution',
    'newsletter',
    'body',
  ]) as PortableTextBlock[] | undefined
  const generatedAt = useFormValue([
    'distribution',
    'newsletter',
    'generatedAt',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError('Post ID not found')
      return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const result = (await generateContent(postId, [
        'newsletter',
      ])) as GenerateResponse
      if (!result.success) {
        setError(result.error || 'Generation failed')
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
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyBodyAsMarkdown = () => {
    if (newsletterBody) {
      const markdown = portableTextToMarkdown(newsletterBody)
      navigator.clipboard.writeText(markdown)
    }
  }

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            Newsletter
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
                isGenerating ? 'Generating...' : 'Generate Newsletter Draft'
              }
              mode="ghost"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={handleGenerate}
              disabled={isGenerating || !postId}
            />
          </Flex>
        </Flex>

        {error && (
          <Text size={0} style={{ color: 'red' }}>
            {error}
          </Text>
        )}

        {/* Use Sanity's default rendering - handles all field updates properly */}
        {props.renderDefault(props)}

        {/* Footer with copy button and generated date */}
        {generatedAt && (
          <Flex align="center" justify="space-between">
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
            <Text size={0} muted>
              Generated: {formatDate(generatedAt)}
            </Text>
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
