'use client'

import { useMemo } from 'react'
import { Button, Flex, Label, Stack } from '@sanity/ui'
import {
  createPatchChannel,
  FormProvider,
  ImageInput,
  ObjectInputProps,
  PatchEvent,
} from 'sanity'
import type { ImageInputProps } from 'sanity'
import type { ImageSchemaType } from '@sanity/types'

type ImageValue = {
  _type?: 'image'
  asset?: { _type?: 'reference'; _ref?: string }
}

interface StandaloneSocialImageUploaderProps {
  label: string
  value?: ImageValue | null
  imageSchemaType?: ImageSchemaType | null
  onChange: (value: ImageValue | null | undefined) => void
  onUseMainImage?: () => void
  onClearImage?: () => void
  disableUseMainImage?: boolean
  disableClearImage?: boolean
}

export function StandaloneSocialImageUploader({
  label,
  value,
  imageSchemaType,
  onChange,
  onUseMainImage,
  onClearImage,
  disableUseMainImage,
  disableClearImage,
}: StandaloneSocialImageUploaderProps) {
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const inputProps = useMemo(() => {
    if (!imageSchemaType) return null

    const handleChange = (event: PatchEvent) => {
      const patches = event.patches || []
      let nextValue: ImageValue | null | undefined = value || undefined

      for (const patch of patches) {
        if (patch.type === 'set') {
          if (patch.path.length === 0) {
            nextValue = patch.value as ImageValue
          } else {
            nextValue = { ...(nextValue || {}) }
            let target: Record<string, unknown> = nextValue as Record<
              string,
              unknown
            >
            for (let i = 0; i < patch.path.length - 1; i += 1) {
              const key = String(patch.path[i])
              if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {}
              }
              target = target[key] as Record<string, unknown>
            }
            target[String(patch.path[patch.path.length - 1])] =
              patch.value as unknown
          }
        }

        if (patch.type === 'unset') {
          if (patch.path.length === 0) {
            nextValue = undefined
          } else if (nextValue) {
            const copy = { ...(nextValue as Record<string, unknown>) }
            let target: Record<string, unknown> = copy
            for (let i = 0; i < patch.path.length - 1; i += 1) {
              const key = String(patch.path[i])
              if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {}
              }
              target = target[key] as Record<string, unknown>
            }
            delete target[String(patch.path[patch.path.length - 1])]
            nextValue = copy as ImageValue
          }
        }

        if (patch.type === 'setIfMissing') {
          if (patch.path.length === 0 && nextValue === undefined) {
            nextValue = patch.value as ImageValue
          }
        }
      }

      onChange(nextValue)
    }

    return {
      id: `image-${label.toLowerCase()}`,
      value: value || undefined,
      schemaType: imageSchemaType,
      path: [],
      level: 0,
      presence: [],
      validation: [],
      onChange: handleChange,
      onFocus: () => {},
      onBlur: () => {},
      readOnly: false,
      members: [],
      renderDefault: (props: ObjectInputProps) => (
        <ImageInput {...(props as unknown as ImageInputProps)} />
      ),
      elementProps: {
        id: `image-${label.toLowerCase()}`,
        onFocus: () => {},
        onBlur: () => {},
        ref: { current: null },
      },
    } as unknown as ObjectInputProps
  }, [imageSchemaType, label, onChange, value])

  if (!inputProps) {
    return null
  }

  return (
    <FormProvider
      __internal_patchChannel={patchChannel}
      id={`image-${label.toLowerCase()}`}
      schemaType={imageSchemaType as ImageSchemaType}
      presence={[]}
      validation={[]}
      focusPath={[]}
      focused={false}
      groups={[]}
      collapsedFieldSets={undefined}
      collapsedPaths={undefined}
      onChange={inputProps.onChange}
      onPathBlur={() => {}}
      onPathFocus={() => {}}
      onPathOpen={() => {}}
      onFieldGroupSelect={() => {}}
      onSetFieldSetCollapsed={() => {}}
      onSetPathCollapsed={() => {}}
    >
      <Stack space={2}>
        <Label size={0} muted>
          {label}
        </Label>
        <Flex gap={2} justify="flex-end">
          {onUseMainImage && (
            <Button
              mode="ghost"
              text="Use main image"
              fontSize={0}
              padding={2}
              disabled={disableUseMainImage}
              onClick={onUseMainImage}
            />
          )}
          {onClearImage && (
            <Button
              mode="ghost"
              tone="critical"
              text="Remove image"
              fontSize={0}
              padding={2}
              disabled={disableClearImage}
              onClick={onClearImage}
            />
          )}
        </Flex>
        <ImageInput {...(inputProps as unknown as ImageInputProps)} />
      </Stack>
    </FormProvider>
  )
}
