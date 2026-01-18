'use client'

import { useState } from 'react'
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
import { generateInstagramDraft } from '../plugins/distribution/actions'

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

  // Read suggested first comment from parent social object
  const suggestedFirstComment = useFormValue([
    'distribution',
    'social',
    'suggestedFirstComment',
  ]) as string | undefined

  // Determine status based on content (now Portable Text array)
  const status =
    instagramCaption && instagramCaption.length > 0 ? 'ready' : 'idle'

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
      const result = (await generateInstagramDraft(postId)) as GenerateResponse
      if (!result.success) {
        setError(result.error || 'Generation failed')
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
              text={isGenerating ? 'Generating...' : 'Generate Instagram Draft'}
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
