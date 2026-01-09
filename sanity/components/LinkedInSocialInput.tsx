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

interface LinkedInSocialInputProps extends ObjectInputProps {
  onGenerate?: () => void
  isGenerating?: boolean
}

export function LinkedInSocialInput(props: LinkedInSocialInputProps) {
  const { members, onGenerate, isGenerating } = props

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

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            LinkedIn
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

        {/* Render the native Sanity image field input (customized via field schema) */}
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
