'use client'

import { Button, Flex, Stack } from '@sanity/ui'
import {
  PatchEvent,
  ObjectInputProps,
  set,
  setIfMissing,
  unset,
  useFormValue,
} from 'sanity'

type ImageRef = { _type?: 'reference'; _ref?: string }

type ImageValue = { _type?: 'image'; asset?: ImageRef }

export function SocialImageInput(props: ObjectInputProps) {
  const mainImageAssetRef = useFormValue(['mainImage', 'asset', '_ref']) as
    | string
    | undefined

  const imageValue = props.value as ImageValue | undefined
  const imageAssetRef = (imageValue?.asset as ImageRef | undefined)?._ref
  const hasImage = Boolean(imageValue?.asset) || Boolean(imageAssetRef)

  const useMainImage = () => {
    if (!mainImageAssetRef) return
    // Mirror the native Sanity image input patch sequence
    const patches = [
      setIfMissing({ _type: 'image' }, []),
      unset(['hotspot']),
      unset(['crop']),
      unset(['media']),
      set({ _type: 'reference', _ref: mainImageAssetRef }, ['asset']),
    ]
    const event = PatchEvent.from(patches)
    props.onChange(event)
  }

  const removeImage = () => {
    // Use field-relative unset([]) - this is what the native image input does
    const event = PatchEvent.from(unset([]))
    props.onChange(event)
  }

  return (
    <div {...props.elementProps}>
      <Stack space={3}>
        {/* Keep this tool "flat": let Sanity's default image input own preview + remove UI.
            We add convenience actions above it. */}
        {(mainImageAssetRef || hasImage) && (
          <Flex gap={2} justify="flex-end">
            {mainImageAssetRef && (
              <Button
                mode="ghost"
                text="Use main image"
                onClick={useMainImage}
              />
            )}
            {hasImage && (
              <Button
                mode="ghost"
                tone="critical"
                text="Remove"
                onClick={removeImage}
              />
            )}
          </Flex>
        )}

        {props.renderDefault(props)}
      </Stack>
    </div>
  )
}
