'use client'

import { Stack, Button, Flex } from '@sanity/ui'

interface ActionButtonsProps {
  loading?: string | null
  onPublishToMedium: () => void
}

export function ActionButtons({
  loading,
  onPublishToMedium,
}: ActionButtonsProps) {
  return (
    <Stack space={2}>
      <Flex gap={2} wrap="wrap">
        <Button
          text="Publish to Medium"
          tone="default"
          disabled={!!loading}
          onClick={onPublishToMedium}
        />
      </Flex>
    </Stack>
  )
}
