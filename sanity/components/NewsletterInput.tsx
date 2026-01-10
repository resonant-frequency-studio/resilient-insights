'use client'

import { useState, useMemo } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  useFormValue,
  MemberField,
  FieldMember,
  ObjectMember,
  PatchEvent,
  set,
} from 'sanity'
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

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

export function NewsletterInput(props: ObjectInputProps) {
  const { members } = props
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

  // Determine status based on content
  const status = newsletterBody && newsletterBody.length > 0 ? 'ready' : 'idle'

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
  const ctaTextMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'ctaText'
      ),
    [members]
  )
  const ctaUrlMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'ctaUrl'
      ),
    [members]
  )

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
        props.onChange(
          PatchEvent.from(
            set({
              title: newsletter.title,
              subtitle: newsletter.subtitle,
              body: newsletter.body,
              ctaText: newsletter.ctaText,
              ctaUrl: newsletter.ctaUrl,
              generatedAt: newsletter.generatedAt,
              model: newsletter.model,
            })
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyBodyAsMarkdown = () => {
    if (newsletterBody) {
      const markdown = portableTextToMarkdown(newsletterBody)
      navigator.clipboard.writeText(markdown)
    }
  }

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

        {/* Title field with copy button */}
        {titleMember && (
          <Stack space={2}>
            <MemberField member={titleMember} {...renderMemberProps} />
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
          </Stack>
        )}

        {/* Subtitle field with copy button */}
        {subtitleMember && (
          <Stack space={2}>
            <MemberField member={subtitleMember} {...renderMemberProps} />
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
          </Stack>
        )}

        {/* Body field with copy button */}
        {bodyMember && (
          <Stack space={2}>
            <MemberField member={bodyMember} {...renderMemberProps} />
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
          </Stack>
        )}

        {/* CTA Text field with copy button */}
        {ctaTextMember && (
          <Stack space={2}>
            <MemberField member={ctaTextMember} {...renderMemberProps} />
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
          </Stack>
        )}

        {/* CTA URL field with copy button */}
        {ctaUrlMember && (
          <Stack space={2}>
            <MemberField member={ctaUrlMember} {...renderMemberProps} />
            <Flex justify="flex-start">
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
          </Stack>
        )}

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
