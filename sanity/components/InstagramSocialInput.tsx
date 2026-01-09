'use client'

import { useMemo, useState } from 'react'
import { Stack, Text, Button, Flex, Card, Label, TextArea, Badge } from '@sanity/ui'
import {
  ObjectInputProps,
  ObjectMember,
  FieldMember,
  MemberField,
  useFormValue,
  PatchEvent,
  set,
} from 'sanity'
import { generateInstagramDraft } from '../plugins/distribution/actions'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

interface GenerateResponse {
  success: boolean
  data?: {
    generated?: {
      social?: {
        instagram?: {
          caption?: string
          hashtags?: string[]
        }
        suggestedFirstComment?: string
      }
    }
  }
  error?: string
}

export function InstagramSocialInput(props: ObjectInputProps) {
  const { members, onChange } = props
  const postId = useFormValue(['_id']) as string | undefined
  const instagramCaption = useFormValue([
    'distribution',
    'social',
    'instagram',
    'caption',
  ]) as string | undefined
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Read suggested first comment from parent social object
  const suggestedFirstComment = useFormValue([
    'distribution',
    'social',
    'suggestedFirstComment',
  ]) as string | undefined

  // Determine status based on content
  const status = instagramCaption ? 'ready' : 'idle'

  // Find the field members that Sanity already prepared for you
  const captionMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'caption'
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
  const hashtagsMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'hashtags'
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
      const result = (await generateInstagramDraft(postId)) as GenerateResponse
      if (!result.success) {
        setError(result.error || 'Generation failed')
        return
      }

      // Update local form state with generated content
      const instagram = result.data?.generated?.social?.instagram
      if (instagram?.caption) {
        onChange(PatchEvent.from(set(instagram.caption, ['caption'])))
      }
      if (instagram?.hashtags) {
        onChange(PatchEvent.from(set(instagram.hashtags, ['hashtags'])))
      }
      // Note: suggestedFirstComment is at social level, will be updated via useFormValue
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
            <Badge tone={status === 'ready' ? 'caution' : 'primary'}>
              {status}
            </Badge>
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

        {/* Render the default "caption" input */}
        {captionMember ? (
          <MemberField
            member={captionMember}
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

        {/* Render hashtags if present */}
        {hashtagsMember ? (
          <MemberField
            member={hashtagsMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        ) : null}

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
      </Stack>
    </Card>
  )
}
