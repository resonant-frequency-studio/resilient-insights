'use client'

import { useMemo, useState } from 'react'
import { Stack, Text, Button, Flex, Card, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  ObjectMember,
  FieldMember,
  MemberField,
  useFormValue,
  PatchEvent,
  set,
} from 'sanity'
import { generateFacebookDraft } from '../plugins/distribution/actions'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

interface GenerateResponse {
  success: boolean
  data?: {
    generated?: {
      social?: {
        facebook?: {
          text?: string
        }
      }
    }
  }
  error?: string
}

export function FacebookSocialInput(props: ObjectInputProps) {
  const { members, onChange } = props
  const postId = useFormValue(['_id']) as string | undefined
  const facebookText = useFormValue([
    'distribution',
    'social',
    'facebook',
    'text',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine status based on content
  const status = facebookText ? 'ready' : 'idle'

  // Find the field members that Sanity already prepared for you
  const textMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'text'
      ),
    [members]
  )
  const imageMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'image'
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
      const result = (await generateFacebookDraft(postId)) as GenerateResponse
      if (!result.success) {
        setError(result.error || 'Generation failed')
        return
      }

      // Update local form state with generated text
      const generatedText = result.data?.generated?.social?.facebook?.text
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
            Facebook
          </Text>
          <Flex align="center" gap={2}>
            <Badge tone={status === 'ready' ? 'caution' : 'primary'}>
              {status}
            </Badge>
            <Button
              type="button"
              text={isGenerating ? 'Generating...' : 'Generate Facebook Draft'}
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

        {/* Render the default "text" input */}
        {textMember ? (
          <MemberField
            member={textMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        ) : null}

        {/* Render the native Sanity image field input */}
        {imageMember ? (
          <MemberField
            member={imageMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        ) : null}
      </Stack>
    </Card>
  )
}
