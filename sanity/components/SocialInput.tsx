'use client'

import { useMemo } from 'react'
import { Stack } from '@sanity/ui'
import {
  ObjectInputProps,
  ObjectMember,
  FieldMember,
  MemberField,
} from 'sanity'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

/**
 * Custom input for the social object that renders each platform
 * with its custom input component (LinkedInSocialInput, etc.)
 * and the suggestedFirstComment as an editable field.
 */
export function SocialInput(props: ObjectInputProps) {
  const { members } = props

  // Find platform members
  const linkedinMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'linkedin'
      ),
    [members]
  )
  const facebookMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'facebook'
      ),
    [members]
  )
  const instagramMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'instagram'
      ),
    [members]
  )
  const suggestedFirstCommentMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember =>
          isFieldMember(m) && m.name === 'suggestedFirstComment'
      ),
    [members]
  )

  return (
    <Stack space={4}>
      {/* LinkedIn */}
      {linkedinMember && (
        <MemberField
          member={linkedinMember}
          renderAnnotation={props.renderAnnotation}
          renderBlock={props.renderBlock}
          renderField={props.renderField}
          renderInlineBlock={props.renderInlineBlock}
          renderInput={props.renderInput}
          renderItem={props.renderItem}
          renderPreview={props.renderPreview}
        />
      )}

      {/* Facebook */}
      {facebookMember && (
        <MemberField
          member={facebookMember}
          renderAnnotation={props.renderAnnotation}
          renderBlock={props.renderBlock}
          renderField={props.renderField}
          renderInlineBlock={props.renderInlineBlock}
          renderInput={props.renderInput}
          renderItem={props.renderItem}
          renderPreview={props.renderPreview}
        />
      )}

      {/* Instagram */}
      {instagramMember && (
        <MemberField
          member={instagramMember}
          renderAnnotation={props.renderAnnotation}
          renderBlock={props.renderBlock}
          renderField={props.renderField}
          renderInlineBlock={props.renderInlineBlock}
          renderInput={props.renderInput}
          renderItem={props.renderItem}
          renderPreview={props.renderPreview}
        />
      )}

      {/* Suggested First Comment - editable */}
      {suggestedFirstCommentMember && (
        <MemberField
          member={suggestedFirstCommentMember}
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
  )
}
