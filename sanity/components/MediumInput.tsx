'use client'

import { useMemo, useState } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  ObjectMember,
  FieldMember,
  MemberField,
  useFormValue,
} from 'sanity'
import { PortableTextBlock } from '@sanity/types'
import { publishToMedium } from '../plugins/distribution/actions'
import { portableTextToMarkdown } from '@/lib/sanity/portableText'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

interface GenerateResponse {
  success: boolean
  error?: string
}

export function MediumInput(props: ObjectInputProps) {
  const { members } = props
  const postId = useFormValue(['_id']) as string | undefined
  const mediumContent = useFormValue([
    'distribution',
    'medium',
    'generatedContent',
  ]) as PortableTextBlock[] | undefined
  const mediumStatus = useFormValue(['distribution', 'medium', 'status']) as
    | string
    | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Find all field members (excluding status which we handle specially)
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
  const tagsMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'tags'
      ),
    [members]
  )
  const generatedContentMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'generatedContent'
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
      }
      // Content will update via useFormValue reactivity
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
      copyToClipboard(markdown)
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

        {error && (
          <Text size={0} style={{ color: 'red' }}>
            {error}
          </Text>
        )}

        {/* Title field */}
        {titleMember && (
          <MemberField
            member={titleMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Subtitle field */}
        {subtitleMember && (
          <MemberField
            member={subtitleMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Tags field */}
        {tagsMember && (
          <MemberField
            member={tagsMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Generated Content field - Portable Text editor */}
        {generatedContentMember && (
          <Stack space={2}>
            <MemberField
              member={generatedContentMember}
              renderAnnotation={props.renderAnnotation}
              renderBlock={props.renderBlock}
              renderField={props.renderField}
              renderInlineBlock={props.renderInlineBlock}
              renderInput={props.renderInput}
              renderItem={props.renderItem}
              renderPreview={props.renderPreview}
            />
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
        )}
      </Stack>
    </Card>
  )
}
