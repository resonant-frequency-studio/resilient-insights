'use client'

import { Stack, Button, Flex } from '@sanity/ui'

interface ActionButtonsProps {
  loading?: string | null
  onGenerateNewsletter: () => void
  onGenerateSocial: () => void
  onPublishToMedium: () => void
}

export function ActionButtons({
  loading,
  onGenerateNewsletter,
  onGenerateSocial,
  onPublishToMedium,
}: ActionButtonsProps) {
  return (
    <Stack space={2}>
      <Flex gap={2} wrap="wrap">
        <Button
          text="Generate Newsletter Draft"
          tone="primary"
          disabled={!!loading}
          onClick={onGenerateNewsletter}
        />
        <Button
          text="Generate Social Drafts"
          tone="primary"
          disabled={!!loading}
          onClick={onGenerateSocial}
        />
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
