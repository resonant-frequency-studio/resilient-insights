'use client'

import { useState } from 'react'
import {
  Dialog,
  Box,
  Stack,
  Button,
  Text,
  Label,
  Flex,
  TextInput,
} from '@sanity/ui'

interface ImagePickerProps {
  onSelect: (assetRefOrUrl: string) => void
  onCancel: () => void
  open: boolean
}

// Helper to convert Sanity image asset reference to URL
function getImageUrlFromAssetRef(assetRef: string): string | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const match = assetRef.match(
    /^image-([^-]+(?:-[^-]+)*?)(?:-\d+x\d+)?-(jpg|png|webp|gif)$/
  )
  if (match) {
    const assetId = match[1]
    const format = match[2] || 'jpg'
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}.${format}`
  }
  const parts = assetRef.replace('image-', '').split('-')
  if (parts.length >= 3) {
    const assetId = parts.slice(0, -2).join('-')
    const format = parts[parts.length - 1]
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}.${format}`
  }
  return null
}

export function ImagePicker({ onSelect, onCancel, open }: ImagePickerProps) {
  const [assetRef, setAssetRef] = useState('')

  const handleSelect = () => {
    if (!assetRef.trim()) return

    // Check if it's already a URL
    if (assetRef.startsWith('http://') || assetRef.startsWith('https://')) {
      onSelect(assetRef)
      setAssetRef('')
      onCancel()
      return
    }

    // Check if it's an asset reference (starts with "image-")
    if (assetRef.startsWith('image-')) {
      // Return the asset reference directly (not the URL)
      onSelect(assetRef.trim())
      setAssetRef('')
      onCancel()
      return
    }

    // Try to parse as Sanity asset reference
    const imageUrl = getImageUrlFromAssetRef(assetRef)
    if (imageUrl) {
      // If we can parse it, it's an asset reference - return the original ref
      onSelect(assetRef.trim())
      setAssetRef('')
      onCancel()
    } else {
      // If it doesn't match, treat as URL anyway
      onSelect(assetRef)
      setAssetRef('')
      onCancel()
    }
  }

  if (!open) return null

  return (
    <Dialog
      header="Select Image from Sanity"
      id="image-picker"
      onClose={onCancel}
      width={1}
      zOffset={1000}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Box>
            <Label size={1} muted>
              Enter a Sanity image asset reference or paste a full image URL
            </Label>
            <Box marginTop={1}>
              <Text size={0} muted>
                To find asset references: Go to the Media tab in Sanity Studio,
                select an image, and copy the asset ID from the URL or metadata.
                You can also paste any image URL directly.
              </Text>
            </Box>
            <Box marginTop={3}>
              <TextInput
                type="text"
                placeholder="image-abc123-jpg or https://cdn.sanity.io/..."
                value={assetRef}
                onChange={e => setAssetRef(e.currentTarget.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && assetRef.trim()) {
                    handleSelect()
                  }
                }}
              />
            </Box>
          </Box>
          <Flex gap={2} justify="flex-end">
            <Button text="Cancel" mode="ghost" onClick={onCancel} />
            <Button
              text="Select"
              tone="primary"
              onClick={handleSelect}
              disabled={!assetRef.trim()}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
