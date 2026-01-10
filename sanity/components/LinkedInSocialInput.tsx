'use client'

import { useState } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import { ObjectInputProps, useFormValue, PatchEvent, set } from 'sanity'
import { generateLinkedInDraft } from '../plugins/distribution/actions'

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
  const [error, setError] = useState<string | null>(null)

  // Determine status based on content (now Portable Text array)
  const status = linkedInText && linkedInText.length > 0 ? 'ready' : 'idle'

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

        {error && (
          <Text size={0} style={{ color: 'red' }}>
            {error}
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
      </Stack>
    </Card>
  )
}
