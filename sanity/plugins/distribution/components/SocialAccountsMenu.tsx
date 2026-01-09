'use client'

import { MenuButton, Menu, MenuItem, Button } from '@sanity/ui'
import { EllipsisVerticalIcon } from '@sanity/icons'
import { connectLinkedIn, disconnectLinkedIn } from '../actions'

interface SocialAccountsData {
  linkedin?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    profileId?: string
    connectedAt?: string
  }
  facebook?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    pageId?: string
    connectedAt?: string
  }
  instagram?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    accountId?: string
    connectedAt?: string
  }
}

interface SocialAccountsMenuProps {
  socialAccounts?: SocialAccountsData
  postId?: string
  loading?: string | null
  onSetLoading: (loading: string | null) => void
  onSetSuccess: (success: string | null) => void
  onSetError: (error: string | null) => void
}

export function SocialAccountsMenu({
  socialAccounts,
  postId,
  loading,
  onSetLoading,
  onSetSuccess,
  onSetError,
}: SocialAccountsMenuProps) {
  const handleConnectLinkedIn = async () => {
    if (!postId) return
    onSetLoading('Connecting...')
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

  const handleDisconnectLinkedIn = async () => {
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

  const isLinkedInConnected =
    socialAccounts?.linkedin?.accessToken != null &&
    socialAccounts.linkedin.accessToken !== ''
  const isFacebookConnected =
    socialAccounts?.facebook?.accessToken != null &&
    socialAccounts.facebook.accessToken !== ''
  const isInstagramConnected =
    socialAccounts?.instagram?.accessToken != null &&
    socialAccounts.instagram.accessToken !== ''

  return (
    <MenuButton
      button={
        <Button
          icon={EllipsisVerticalIcon}
          mode="ghost"
          padding={2}
          title="Social Accounts"
        />
      }
      id="social-accounts-menu"
      popover={{ placement: 'bottom-end', portal: true }}
      menu={
        <Menu>
          <MenuItem
            text={
              isLinkedInConnected ? 'Disconnect LinkedIn' : 'Connect LinkedIn'
            }
            onClick={() => {
              if (isLinkedInConnected) {
                handleDisconnectLinkedIn()
              } else {
                handleConnectLinkedIn()
              }
            }}
            disabled={!!loading}
            tone={isLinkedInConnected ? 'critical' : 'default'}
          />
          <MenuItem
            text={
              isFacebookConnected
                ? 'Disconnect Facebook'
                : 'Connect Facebook (not implemented)'
            }
            onClick={() => {
              // Placeholder for future Facebook implementation
            }}
            disabled={true}
          />
          <MenuItem
            text={
              isInstagramConnected
                ? 'Disconnect Instagram'
                : 'Connect Instagram (not implemented)'
            }
            onClick={() => {
              // Placeholder for future Instagram implementation
            }}
            disabled={true}
          />
        </Menu>
      }
    />
  )
}
