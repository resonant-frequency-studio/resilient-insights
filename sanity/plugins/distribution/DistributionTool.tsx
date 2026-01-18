'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  Stack,
  Text,
  Flex,
  MenuButton,
  Menu,
  MenuItem,
  Button,
  Box,
} from '@sanity/ui'
import { EllipsisVerticalIcon } from '@sanity/icons'
import {
  useFormValue,
  ObjectInputProps,
  MemberField,
  FieldMember,
  ObjectMember,
} from 'sanity'
import { schedulePost, connectLinkedIn, disconnectLinkedIn } from './actions'
import { SchedulePicker } from './SchedulePicker'
import { ScheduledPostsList } from './ScheduledPostsList'
import imageUrlBuilder from '@sanity/image-url'

/**
 * Distribution Tool Component
 *
 * This component should be used as a custom input component for the distribution field
 * or integrated as a document view in Sanity Studio.
 *
 * To use as a custom input:
 * 1. Import this component in your post schema
 * 2. Set the distribution field's components.input to DistributionTool
 */

interface DistributionData {
  newsletter?: {
    title?: string
    subtitle?: string
    body?: string
    ctaText?: string
    ctaUrl?: string
    generatedAt?: string
    model?: string
  }
  social?: {
    linkedin?: {
      text?: string
      image?: { asset?: { _ref?: string; _type?: string }; _type?: string }
    }
    facebook?: {
      text?: string
      image?: { asset?: { _ref?: string; _type?: string }; _type?: string }
    }
    instagram?: {
      caption?: string
      hashtags?: string[]
      image?: { asset?: { _ref?: string; _type?: string }; _type?: string }
    }
    suggestedFirstComment?: string
    generatedAt?: string
    model?: string
  }
  medium?: {
    status?: 'idle' | 'ready' | 'error'
    canonicalUrl?: string
    body?: string
    title?: string
    subtitle?: string
    tags?: string[]
    generatedAt?: string
    error?: string
  }
  scheduledPosts?: Array<{
    channel: 'linkedin' | 'facebook' | 'instagram'
    content: string
    scheduledAt: string
    status: 'scheduled' | 'published' | 'failed'
    platformPostId?: string
    error?: string
    publishedAt?: string
  }>
  socialAccounts?: {
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
}

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

export const DistributionTool = (props: ObjectInputProps<DistributionData>) => {
  const { members } = props

  // Use useFormValue to get reactive distribution value that updates automatically
  const distributionFromForm = useFormValue(['distribution']) as
    | DistributionData
    | undefined
  const distribution = distributionFromForm || props.value

  // Get document data using Sanity hooks
  const documentId = useFormValue(['_id']) as string | undefined
  const postId = documentId

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSchedulePicker, setShowSchedulePicker] = useState<
    'linkedin' | 'facebook' | 'instagram' | null
  >(null)
  const [recommendations] = useState<string[]>([])

  // Check if social accounts are connected
  const isLinkedInConnected = Boolean(
    distribution?.socialAccounts?.linkedin?.accessToken
  )
  // Facebook and Instagram connection not yet implemented
  const _isFacebookConnected = Boolean(
    distribution?.socialAccounts?.facebook?.accessToken
  )
  const _isInstagramConnected = Boolean(
    distribution?.socialAccounts?.instagram?.accessToken
  )
  void _isFacebookConnected
  void _isInstagramConnected

  // Handle LinkedIn connection
  const handleConnectLinkedIn = useCallback(async () => {
    if (!postId) return
    setLoading('Connecting LinkedIn...')
    const result = await connectLinkedIn(postId)
    if (result.success && result.authUrl) {
      window.location.href = result.authUrl
    } else {
      setError(result.error || 'Failed to connect LinkedIn')
    }
    setLoading(null)
  }, [postId])

  // Handle LinkedIn disconnection
  const handleDisconnectLinkedIn = useCallback(async () => {
    if (!postId) return
    setLoading('Disconnecting LinkedIn...')
    const result = await disconnectLinkedIn(postId)
    if (result.success) {
      queueMicrotask(() => {
        setSuccess('LinkedIn disconnected successfully')
      })
    } else {
      setError(result.error || 'Failed to disconnect LinkedIn')
    }
    setLoading(null)
  }, [postId])

  // Find the newsletter member for MemberField rendering
  const newsletterMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'newsletter'
      ),
    [members]
  )

  // Find the social member for MemberField rendering
  const socialMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'social'
      ),
    [members]
  )

  // Find the medium member for MemberField rendering
  const mediumMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'medium'
      ),
    [members]
  )

  // Helper to get image URL from Sanity image reference using image URL builder
  const getImageUrl = (
    imageSource:
      | { asset?: { _ref?: string; _type?: string }; _type?: string }
      | undefined
  ): string | null => {
    if (!imageSource?.asset?._ref) return null

    try {
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

      const builder = imageUrlBuilder({
        projectId,
        dataset,
      })
      const imageBuilder = builder.image(
        imageSource as { asset: { _ref: string } }
      )
      return imageBuilder.url()
    } catch (error) {
      // Silently fail in production - image URL building is non-critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to build image URL with builder:', error)
      }
      return null
    }
  }

  // Check for LinkedIn connection success from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('linkedin_connected') === 'true') {
        // Remove the parameter from URL first
        params.delete('linkedin_connected')
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
        window.history.replaceState({}, '', newUrl)
        // Defer setState to avoid synchronous state update in effect
        queueMicrotask(() => {
          setSuccess('LinkedIn account connected successfully!')
        })
      }
    }
  }, [])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <Box>
      <Stack space={4}>
        {/* Status Messages */}
        {error && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{error}</Text>
          </Card>
        )}
        {success && (
          <Card padding={3} radius={2} tone="positive">
            <Text size={1}>{success}</Text>
          </Card>
        )}

        {/* Newsletter Section - Using MemberField for native Sanity rendering */}
        {newsletterMember && (
          <MemberField
            member={newsletterMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Medium Section - Using MemberField for native Sanity rendering */}
        {mediumMember && (
          <MemberField
            member={mediumMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        )}

        {/* Social Media Section - Using MemberField for native Sanity rendering */}
        {socialMember && (
          <>
            {/* Header with three-dot menu */}
            <Flex align="center" justify="flex-end">
              <MenuButton
                button={
                  <Button
                    icon={EllipsisVerticalIcon}
                    mode="bleed"
                    padding={2}
                    disabled={loading !== null}
                  />
                }
                id="social-accounts-menu"
                menu={
                  <Menu>
                    {isLinkedInConnected ? (
                      <MenuItem
                        text="Disconnect LinkedIn"
                        onClick={handleDisconnectLinkedIn}
                      />
                    ) : (
                      <MenuItem
                        text="Connect LinkedIn"
                        onClick={handleConnectLinkedIn}
                      />
                    )}
                    <MenuItem text="Connect Facebook" disabled tone="default" />
                    <MenuItem
                      text="Connect Instagram"
                      disabled
                      tone="default"
                    />
                  </Menu>
                }
                popover={{ portal: true }}
              />
            </Flex>
            <MemberField
              member={socialMember}
              renderAnnotation={props.renderAnnotation}
              renderBlock={props.renderBlock}
              renderField={props.renderField}
              renderInlineBlock={props.renderInlineBlock}
              renderInput={props.renderInput}
              renderItem={props.renderItem}
              renderPreview={props.renderPreview}
            />
          </>
        )}

        {/* Schedule Picker */}
        {showSchedulePicker && distribution?.social && (
          <SchedulePicker
            channel={showSchedulePicker}
            recommendations={recommendations}
            selectedImageUrl={
              showSchedulePicker === 'linkedin'
                ? getImageUrl(distribution.social.linkedin?.image) || undefined
                : showSchedulePicker === 'facebook'
                  ? getImageUrl(distribution.social.facebook?.image) ||
                    undefined
                  : getImageUrl(distribution.social.instagram?.image) ||
                    undefined
            }
            onSchedule={async scheduledAt => {
              if (!postId || !distribution?.social) return
              let content = ''
              let imageAssetRef: string | undefined
              if (showSchedulePicker === 'linkedin') {
                content = distribution.social.linkedin?.text || ''
                imageAssetRef = distribution.social.linkedin?.image?.asset?._ref
              } else if (showSchedulePicker === 'facebook') {
                content = distribution.social.facebook?.text || ''
                imageAssetRef = distribution.social.facebook?.image?.asset?._ref
              } else if (showSchedulePicker === 'instagram') {
                content = distribution.social.instagram?.caption || ''
                imageAssetRef =
                  distribution.social.instagram?.image?.asset?._ref
              }

              // Resolve image asset ref to URL for scheduling
              const imageUrl = imageAssetRef
                ? getImageUrl({
                    asset: { _ref: imageAssetRef },
                  }) || undefined
                : undefined

              setLoading('Scheduling...')
              const result = await schedulePost(
                postId,
                showSchedulePicker,
                content,
                scheduledAt,
                imageUrl
              )
              if (result.success) {
                setSuccess('Post scheduled successfully!')
                setShowSchedulePicker(null)
                // Distribution value will update automatically via useFormValue
              } else {
                setError(result.error || 'Failed to schedule post')
              }
              setLoading(null)
            }}
            onCancel={() => setShowSchedulePicker(null)}
            loading={loading === 'Scheduling...'}
          />
        )}

        {/* Scheduled Posts */}
        {distribution?.scheduledPosts &&
          distribution.scheduledPosts.length > 0 && (
            <Card padding={3} radius={2} tone="transparent" border>
              <Stack space={2}>
                <Text size={1} weight="bold">
                  Scheduled Posts
                </Text>
                <ScheduledPostsList
                  scheduledPosts={distribution.scheduledPosts}
                  onCancel={async () => {
                    if (!postId) return
                    // TODO: Implement cancel scheduled post API call
                    setError('Cancel functionality not yet implemented')
                  }}
                />
              </Stack>
            </Card>
          )}
      </Stack>
    </Box>
  )
}
