'use client'

import { Card, Stack, Button, Text, Flex, Badge } from '@sanity/ui'
import { disconnectLinkedIn, connectLinkedIn } from '../actions'

interface LinkedInAccountData {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  profileId?: string
  connectedAt?: string
}

interface LinkedInAccountSectionProps {
  linkedinAccount?: LinkedInAccountData
  postId?: string
  loading?: string | null
  onSetLoading: (loading: string | null) => void
  onSetSuccess: (success: string | null) => void
  onSetError: (error: string | null) => void
}

export function LinkedInAccountSection({
  linkedinAccount,
  postId,
  loading,
  onSetLoading,
  onSetSuccess,
  onSetError,
}: LinkedInAccountSectionProps) {
  const handleDisconnect = async () => {
    if (!postId) return
    onSetLoading('Disconnecting...')
    const result = await disconnectLinkedIn(postId)
    if (result.success) {
      onSetSuccess('LinkedIn disconnected')
    } else {
      onSetError(result.error || 'Failed to disconnect')
    }
    onSetLoading(null)
  }

  const handleConnect = async () => {
    if (!postId) return
    onSetLoading('Connecting...')
    // Pass current window location as returnUrl so we can redirect back here
    const returnUrl =
      typeof window !== 'undefined' ? window.location.href : undefined
    const result = await connectLinkedIn(postId, returnUrl)
    if (result.success && result.authUrl) {
      window.location.href = result.authUrl
    } else {
      onSetError(result.error || 'Failed to initiate connection')
      onSetLoading(null)
    }
  }

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={2}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            LinkedIn Account
          </Text>
          {linkedinAccount?.accessToken ? (
            <Badge tone="positive">Connected</Badge>
          ) : (
            <Badge tone="caution">Not Connected</Badge>
          )}
        </Flex>
        {linkedinAccount?.accessToken ? (
          <Flex gap={2}>
            <Text size={0} muted>
              Connected:{' '}
              {linkedinAccount.connectedAt
                ? new Date(linkedinAccount.connectedAt).toLocaleString()
                : 'Unknown'}
            </Text>
            <Button
              text="Disconnect"
              mode="ghost"
              fontSize={0}
              tone="critical"
              onClick={handleDisconnect}
              disabled={!!loading}
            />
          </Flex>
        ) : (
          <Button
            text="Connect LinkedIn"
            tone="primary"
            onClick={handleConnect}
            disabled={!!loading}
          />
        )}
      </Stack>
    </Card>
  )
}
