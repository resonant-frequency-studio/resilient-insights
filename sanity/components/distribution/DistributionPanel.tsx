'use client'

import { useMemo } from 'react'
import { Box, Text } from '@sanity/ui'
import {
  useFormValue,
  ObjectInputProps,
  useFormBuilder,
  FieldMember,
  ObjectMember,
  ObjectSchemaType,
} from 'sanity'
import { DistributionTool } from '../../plugins/distribution/DistributionTool'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

/**
 * Distribution Panel Component
 *
 * Renders the DistributionTool component in the right panel of the split layout.
 * This component must be rendered within form context (which it is, since it's
 * part of the document editor).
 *
 * DistributionTool needs full ObjectInputProps including members, renderInput, renderField, etc.
 * to properly render MemberField components for newsletter, medium, and social sections.
 */

interface DistributionPanelProps {
  documentId: string
  schemaType: { name: string }
  // Document members - we'll find the distribution field member from these
  documentMembers?: ObjectMember[]
  // Optional: pass form builder props if available
  formBuilderProps?: {
    renderInput?: ObjectInputProps['renderInput']
    renderField?: ObjectInputProps['renderField']
    renderAnnotation?: ObjectInputProps['renderAnnotation']
    renderBlock?: ObjectInputProps['renderBlock']
    renderInlineBlock?: ObjectInputProps['renderInlineBlock']
    renderItem?: ObjectInputProps['renderItem']
    renderPreview?: ObjectInputProps['renderPreview']
    renderDefault?: ObjectInputProps['renderDefault']
  }
}

export function DistributionPanel(props: DistributionPanelProps) {
  // Get distribution value from form context
  const distribution = useFormValue(['distribution'])

  // Try to get form builder to access render functions
  const formBuilder = useFormBuilder()
  const renderInput =
    props.formBuilderProps?.renderInput || formBuilder?.renderInput

  // Find the distribution field member from document members (even if hidden)
  // Hidden fields might still be in members, just not displayed
  const distributionFieldMember = useMemo(() => {
    if (!props.documentMembers || !Array.isArray(props.documentMembers)) {
      return null
    }
    return (
      props.documentMembers.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'distribution'
      ) || null
    )
  }, [props.documentMembers])

  // Get members from the distribution field member if available
  // If not available (hidden field), we'll pass an empty array and DistributionTool
  // will need to work without MemberField components
  const distributionMembers = useMemo(() => {
    if (distributionFieldMember && distributionFieldMember.kind === 'field') {
      const field = distributionFieldMember.field
      // Check if field has members property
      if (field && typeof field === 'object' && 'members' in field) {
        const members = (field as { members?: ObjectMember[] }).members
        if (Array.isArray(members)) {
          return members
        }
      }
    }
    // Return empty array if we can't get members
    // DistributionTool can still work, just won't use MemberField
    return []
  }, [distributionFieldMember])

  // Create props for DistributionTool
  // Ensure members is always an array to avoid undefined errors
  const distributionToolProps: ObjectInputProps = {
    value: (distribution as Record<string, unknown>) || undefined,
    path: ['distribution'],
    schemaType: {
      name: 'object',
      jsonType: 'object',
      type: {
        name: 'object',
        jsonType: 'object',
      },
    } as ObjectSchemaType,
    members: Array.isArray(distributionMembers) ? distributionMembers : [],
    onChange: () => {
      // DistributionTool uses PatchEvent.from(set(...)) directly via useFormValue
    },
    // Include render functions - ensure they're always functions
    renderInput: renderInput || (() => null),
    renderField:
      props.formBuilderProps?.renderField ||
      formBuilder?.renderField ||
      (() => null),
    renderAnnotation:
      props.formBuilderProps?.renderAnnotation ||
      formBuilder?.renderAnnotation ||
      (() => null),
    renderBlock:
      props.formBuilderProps?.renderBlock ||
      formBuilder?.renderBlock ||
      (() => null),
    renderInlineBlock:
      props.formBuilderProps?.renderInlineBlock ||
      formBuilder?.renderInlineBlock ||
      (() => null),
    renderItem:
      props.formBuilderProps?.renderItem ||
      formBuilder?.renderItem ||
      (() => null),
    renderPreview:
      props.formBuilderProps?.renderPreview ||
      formBuilder?.renderPreview ||
      (() => null),
    // Required ObjectInputProps fields
    id: 'distribution',
    level: 0,
    onFocus: () => {},
    onBlur: () => {},
    readOnly: false,
    presence: [],
    validation: { isValidating: false, annotations: [] },
    // renderDefault is required for nested fields like SocialImageInput
    // MemberField will provide it to nested fields, but we need to ensure it's available
    renderDefault:
      props.formBuilderProps?.renderDefault ||
      (renderInput
        ? (inputProps: ObjectInputProps) => {
            // Use renderInput as fallback for renderDefault
            return renderInput(inputProps)
          }
        : undefined),
    elementProps: {
      id: 'distribution-element',
      onFocus: () => {},
      onBlur: () => {},
      ref: { current: null },
      'aria-describedby': 'distribution-description',
    },
  } as unknown as ObjectInputProps

  if (!renderInput) {
    return (
      <Box padding={4}>
        <Text size={1} muted>
          Distribution panel: Form context not available. This panel requires
          form context to function.
        </Text>
      </Box>
    )
  }

  // Add a visible container to debug if the panel is rendering
  return (
    <Box>
      <Text size={2} weight="bold" style={{ marginBottom: '16px' }}>
        Distribution Panel
      </Text>
      <DistributionTool {...distributionToolProps} />
    </Box>
  )
}

export default DistributionPanel
