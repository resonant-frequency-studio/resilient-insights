'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, Stack, Text, Flex } from '@sanity/ui'
import {
  useFormValue,
  ObjectInputProps,
  MemberField,
  FieldMember,
  ObjectMember,
} from 'sanity'
import { generateContent, publishToMedium, schedulePost } from './actions'
import { SchedulePicker } from './SchedulePicker'
import { ScheduledPostsList } from './ScheduledPostsList'
import { NewsletterSection } from './components/NewsletterSection'
import { SocialAccountsMenu } from './components/SocialAccountsMenu'
import { MediumStatusSection } from './components/MediumStatusSection'
import { ActionButtons } from './components/ActionButtons'
import { StatusMessages } from './components/StatusMessages'
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
    subject?: string
    preheader?: string
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
    generatedContent?: string
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

  // Find the social member for MemberField rendering
  const socialMember = useMemo(
    () =>
      members?.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'social'
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
      console.warn('Failed to build image URL with builder:', error)
      return null
    }
  }

  // Check for LinkedIn connection success from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('linkedin_connected') === 'true') {
        setSuccess('LinkedIn account connected successfully!')
        // Remove the parameter from URL
        params.delete('linkedin_connected')
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
        window.history.replaceState({}, '', newUrl)
        // Distribution value will update automatically via useFormValue
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

  const handleGenerate = async (targets: ('newsletter' | 'social')[]) => {
    if (!postId) {
      setError('Post ID not found')
      return
    }

    setLoading(`Generating ${targets.join(' and ')}...`)
    setError(null)

    try {
      const result = await generateContent(postId, targets, false)
      if (result.success) {
        setSuccess(`${targets.join(' and ')} generated successfully!`)
        // Distribution value will update automatically via useFormValue
      } else {
        setError(result.error || 'Generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(null)
    }
  }

  const handlePublishToMedium = async () => {
    if (!postId) {
      setError('Post ID not found')
      return
    }

    setLoading('Publishing to Medium...')
    setError(null)

    try {
      const result = await publishToMedium(postId)
      if (result.success) {
        setSuccess('Published to Medium successfully!')
        // Distribution value will update automatically via useFormValue
      } else {
        setError(result.error || 'Medium publish failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
  }

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={2} weight="bold">
            Distribution
          </Text>
          <SocialAccountsMenu
            socialAccounts={distribution?.socialAccounts}
            postId={postId}
            loading={loading}
            onSetLoading={setLoading}
            onSetSuccess={setSuccess}
            onSetError={setError}
          />
        </Flex>

        {/* Action Buttons */}
        <ActionButtons
          loading={loading}
          onPublishToMedium={handlePublishToMedium}
        />

        {/* Status Messages */}
        <StatusMessages loading={loading} error={error} success={success} />

        {/* Newsletter Section */}
        <NewsletterSection
          newsletter={distribution?.newsletter || {}}
          onChange={props.onChange}
          onCopy={copyToClipboard}
          onGenerate={() => handleGenerate(['newsletter'])}
          isGenerating={loading === 'Generating newsletter...'}
        />

        {/* Social Media Section - Using MemberField for native Sanity rendering */}
        {socialMember && (
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={4}>
              <Text size={1} weight="bold">
                Social Media
              </Text>
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
            </Stack>
          </Card>
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

        {/* Medium Status */}
        {distribution?.medium && (
          <MediumStatusSection
            medium={distribution.medium}
            onCopy={copyToClipboard}
          />
        )}
      </Stack>
    </Card>
  )
}
