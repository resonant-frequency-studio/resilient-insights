'use client'

import { useState, useMemo } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  useFormValue,
  PatchEvent,
  set,
  MemberField,
  FieldMember,
  ObjectMember,
} from 'sanity'
import { PortableTextBlock } from '@sanity/types'
import { publishToMedium } from '../plugins/distribution/actions'
import { portableTextToMarkdown } from '@/lib/sanity/portableText'
import { plainTextToPortableText } from '@/lib/sanity/portableTextConverter'

interface GenerateResponse {
  success: boolean
  data?: {
    title?: string
    subtitle?: string
    content?: string
    tags?: string[]
  }
  error?: string
}

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

export function MediumInput(props: ObjectInputProps) {
  const { onChange, members } = props
  const postId = useFormValue(['_id']) as string | undefined
  const mediumContent = useFormValue([
    'distribution',
    'medium',
    'generatedContent',
  ]) as PortableTextBlock[] | undefined
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

  // Find visible field members (exclude hidden fields)
  const visibleMembers = useMemo(() => {
    return (
      members?.filter(
        (m): m is FieldMember =>
          isFieldMember(m) &&
          m.name !== 'status' &&
          m.name !== 'canonicalUrl' &&
          m.name !== 'generatedAt' &&
          m.name !== 'error'
      ) || []
    )
  }, [members])

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
      const data = result.data
      if (data) {
        if (data.title) {
          onChange(PatchEvent.from(set(data.title, ['title'])))
        }
        if (data.subtitle) {
          onChange(PatchEvent.from(set(data.subtitle, ['subtitle'])))
        }
        if (data.content) {
          // Convert plain text to Portable Text for local state
          const portableText = plainTextToPortableText(data.content)
          onChange(PatchEvent.from(set(portableText, ['generatedContent'])))
        }
        if (data.tags) {
          onChange(PatchEvent.from(set(data.tags, ['tags'])))
        }
        // Set status and generatedAt
        onChange(PatchEvent.from(set('ready', ['status'])))
        onChange(
          PatchEvent.from(set(new Date().toISOString(), ['generatedAt']))
        )
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

        {/* Display error as text, not textarea */}
        {displayError && (
          <Text size={0} style={{ color: '#f03e3e' }}>
            Error: {displayError}
          </Text>
        )}

        {/* Render each field using MemberField */}
        {visibleMembers.map(member => (
          <MemberField
            key={member.key}
            member={member}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        ))}

        {/* Footer with generated date and copy button - only show when content exists */}
        {generatedAt && (
          <>
            {/* Display generatedAt as small muted text - bottom right */}
            <Flex justify="flex-end">
              <Text size={0} muted>
                Generated: {formatDate(generatedAt)}
              </Text>
            </Flex>

            {/* Copy button for content */}
            <Stack space={2}>
              <Flex gap={2}>
                <Button
                  type="button"
                  text="Copy Content (Markdown)"
                  mode="ghost"
                  fontSize={0}
                  padding={1}
                  onClick={copyContentAsMarkdown}
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
          </>
        )}
      </Stack>
    </Card>
  )
}
