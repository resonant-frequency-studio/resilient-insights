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
import { generateContent } from '../plugins/distribution/actions'
import { portableTextToMarkdown } from '@/lib/sanity/portableText'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

interface GenerateResponse {
  success: boolean
  error?: string
}

export function NewsletterInput(props: ObjectInputProps) {
  const { members } = props
  const postId = useFormValue(['_id']) as string | undefined
  const newsletterBody = useFormValue(['distribution', 'newsletter', 'body']) as
    | PortableTextBlock[]
    | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine status based on content
  const status = newsletterBody && newsletterBody.length > 0 ? 'ready' : 'idle'

  // Find all field members
  const subjectMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'subject'
      ),
    [members]
  )
  const preheaderMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'preheader'
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

  const handleGenerate = async () => {
    if (!postId) {
      setError('Post ID not found')
      return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const result = (await generateContent(
        postId,
        ['newsletter']
      )) as GenerateResponse
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

  const copyBodyAsMarkdown = () => {
    if (newsletterBody) {
      const markdown = portableTextToMarkdown(newsletterBody)
      copyToClipboard(markdown)
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
              text={isGenerating ? 'Generating...' : 'Generate Newsletter Draft'}
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

        {/* Subject field */}
        {subjectMember && (
          <MemberField
            member={subjectMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Preheader field */}
        {preheaderMember && (
          <MemberField
            member={preheaderMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Body field - Portable Text editor */}
        {bodyMember && (
          <Stack space={2}>
            <MemberField
              member={bodyMember}
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
                text="Copy Body (Markdown)"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={copyBodyAsMarkdown}
              />
            </Flex>
          </Stack>
        )}

        {/* CTA Text field */}
        {ctaTextMember && (
          <MemberField
            member={ctaTextMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* CTA URL field */}
        {ctaUrlMember && (
          <MemberField
            member={ctaUrlMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}
      </Stack>
    </Card>
  )
}
