'use client'

import { useState, useMemo } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  useFormValue,
  MemberField,
  FieldMember,
  ObjectMember,
} from 'sanity'
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

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

export function MediumInput(props: ObjectInputProps) {
  const { members } = props
  const postId = useFormValue(['_id']) as string | undefined
  const mediumTitle = useFormValue(['distribution', 'medium', 'title']) as
    | string
    | undefined
  const mediumSubtitle = useFormValue([
    'distribution',
    'medium',
    'subtitle',
  ]) as string | undefined
  const mediumContent = useFormValue(['distribution', 'medium', 'body']) as
    | PortableTextBlock[]
    | undefined
  const mediumTags = useFormValue(['distribution', 'medium', 'tags']) as
    | string[]
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

  // Find specific field members
  const titleMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'title'
      ),
    [members]
  )
  const subtitleMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'subtitle'
      ),
    [members]
  )
  const bodyMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'body'
      ),
    [members]
  )
  const tagsMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'tags'
      ),
    [members]
  )

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
      // Content is saved to Sanity by the API
      // The form will update via Sanity's real-time sync
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyContentAsMarkdown = () => {
    if (mediumContent) {
      const markdown = portableTextToMarkdown(mediumContent)
      navigator.clipboard.writeText(markdown)
    }
  }

  const copyTagsAsCommaSeparated = () => {
    if (mediumTags && mediumTags.length > 0) {
      navigator.clipboard.writeText(mediumTags.join(', '))
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

  const renderMemberProps = {
    renderAnnotation: props.renderAnnotation,
    renderBlock: props.renderBlock,
    renderField: props.renderField,
    renderInlineBlock: props.renderInlineBlock,
    renderInput: props.renderInput,
    renderItem: props.renderItem,
    renderPreview: props.renderPreview,
  }

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

        {/* Title field with copy button */}
        {titleMember && (
          <Stack space={2}>
            <MemberField member={titleMember} {...renderMemberProps} />
            <Button
              type="button"
              text="Copy Title"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => copyToClipboard(mediumTitle || '')}
              disabled={!mediumTitle}
            />
          </Stack>
        )}

        {/* Subtitle field with copy button */}
        {subtitleMember && (
          <Stack space={2}>
            <MemberField member={subtitleMember} {...renderMemberProps} />
            <Button
              type="button"
              text="Copy Subtitle"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => copyToClipboard(mediumSubtitle || '')}
              disabled={!mediumSubtitle}
            />
          </Stack>
        )}

        {/* Body field with copy button */}
        {bodyMember && (
          <Stack space={2}>
            <MemberField member={bodyMember} {...renderMemberProps} />
            <Button
              type="button"
              text="Copy Body (Markdown)"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={copyContentAsMarkdown}
              disabled={!mediumContent || mediumContent.length === 0}
            />
          </Stack>
        )}

        {/* Tags field with copy button */}
        {tagsMember && (
          <Stack space={2}>
            <MemberField member={tagsMember} {...renderMemberProps} />
            <Button
              type="button"
              text="Copy Tags"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={copyTagsAsCommaSeparated}
              disabled={!mediumTags || mediumTags.length === 0}
            />
          </Stack>
        )}

        {/* Footer with generated date and Medium link - only show when content exists */}
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
