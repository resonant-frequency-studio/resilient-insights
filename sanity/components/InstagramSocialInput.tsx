'use client'

import { useMemo } from 'react'
import { Stack, Text, Button, Flex, Card } from '@sanity/ui'
import {
  ObjectInputProps,
  ObjectMember,
  FieldMember,
  MemberField,
} from 'sanity'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

interface InstagramSocialInputProps extends ObjectInputProps {
  onGenerate?: () => void
  isGenerating?: boolean
}

export function InstagramSocialInput(props: InstagramSocialInputProps) {
  const { members, onGenerate, isGenerating } = props

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

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            Instagram
          </Text>
          {onGenerate && (
            <Button
              text="Generate Draft"
              mode="ghost"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={onGenerate}
              disabled={isGenerating}
            />
          )}
        </Flex>

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

        {/* This is the key: render the native Sanity image field input */}
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
      </Stack>
    </Card>
  )
}
