'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  TextArea,
  Badge,
} from '@sanity/ui'
import {
  PortableTextBlock,
  ImageSchemaType,
  ObjectSchemaType,
} from '@sanity/types'
import imageUrlBuilder from '@sanity/image-url'
import { useSchema } from 'sanity'
import {
  generateFacebookDraft,
  generateInstagramDraft,
  generateLinkedInDraft,
  schedulePost,
} from '../../distribution/actions'
import {
  plainTextToPortableText,
  portableTextToPlainTextString,
} from '@/lib/sanity/portableTextConverter'
import { ScheduleModal } from '@/sanity/components/ScheduleModal'
import { useRateLimitCountdown } from '@/sanity/components/hooks/useRateLimitCountdown'
import { ScheduledPostsList } from '../../distribution/ScheduledPostsList'
import { StandaloneSocialImageUploader } from './StandaloneSocialImageUploader'
import { getNextOptimalTimes } from '@/lib/scheduler/recommendations'
import type { SanityImageReference } from '@/lib/social/imageOptimizer'

interface SocialData {
  linkedin?: { text?: PortableTextBlock[]; image?: unknown }
  facebook?: { text?: PortableTextBlock[]; image?: unknown }
  instagram?: {
    caption?: PortableTextBlock[]
    hashtags?: string[]
    image?: unknown
  }
  suggestedFirstComment?: string
  generatedAt?: string
  model?: string
}

interface ImageAssetRef {
  _ref?: string
  _type?: string
}

interface ImageValue {
  _type?: string
  asset?: ImageAssetRef
  hotspot?: SanityImageReference['hotspot']
  crop?: SanityImageReference['crop']
}

function toSanityImageReference(
  image: ImageValue | undefined
): SanityImageReference | undefined {
  if (!image?.asset?._ref) return undefined

  return {
    _type: 'image',
    asset: {
      _ref: image.asset._ref,
      _type: 'reference',
    },
    ...(image.hotspot ? { hotspot: image.hotspot } : {}),
    ...(image.crop ? { crop: image.crop } : {}),
  }
}

interface StandaloneSocialEditorProps {
  postId: string
  social?: Record<string, unknown>
  scheduledPosts?: Array<Record<string, unknown>>
  mainImageAssetRef?: string
  onSave: (path: string[], value: unknown) => Promise<void>
  onRefresh: () => Promise<void>
}

export function StandaloneSocialEditor({
  postId,
  social,
  scheduledPosts,
  mainImageAssetRef,
  onSave,
  onRefresh,
}: StandaloneSocialEditorProps) {
  const schema = useSchema()
  const data = useMemo(() => (social || {}) as SocialData, [social])
  const [linkedinText, setLinkedinText] = useState(
    portableTextToPlainTextString(data.linkedin?.text)
  )
  const [facebookText, setFacebookText] = useState(
    portableTextToPlainTextString(data.facebook?.text)
  )
  const [instagramCaption, setInstagramCaption] = useState(
    portableTextToPlainTextString(data.instagram?.caption)
  )
  const [instagramHashtags, setInstagramHashtags] = useState(
    (data.instagram?.hashtags || []).join(', ')
  )
  const [suggestedFirstComment, setSuggestedFirstComment] = useState(
    data.suggestedFirstComment || ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState({
    linkedin: false,
    facebook: false,
    instagram: false,
  })
  const { rateLimitRemainingSeconds: linkedinRateLimitRemainingSeconds } =
    useRateLimitCountdown(postId, 'linkedin')
  const { rateLimitRemainingSeconds: facebookRateLimitRemainingSeconds } =
    useRateLimitCountdown(postId, 'facebook')
  const { rateLimitRemainingSeconds: instagramRateLimitRemainingSeconds } =
    useRateLimitCountdown(postId, 'instagram')
  const rateLimitRemaining = useMemo(
    () => ({
      linkedin: linkedinRateLimitRemainingSeconds,
      facebook: facebookRateLimitRemainingSeconds,
      instagram: instagramRateLimitRemainingSeconds,
    }),
    [
      facebookRateLimitRemainingSeconds,
      instagramRateLimitRemainingSeconds,
      linkedinRateLimitRemainingSeconds,
    ]
  )

  const [showSchedulePicker, setShowSchedulePicker] = useState<
    'linkedin' | 'facebook' | 'instagram' | null
  >(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const recommendations = useMemo(
    () => ({
      linkedin: getNextOptimalTimes('linkedin', new Date(), 5).map(date =>
        date.toISOString()
      ),
      facebook: getNextOptimalTimes('facebook', new Date(), 5).map(date =>
        date.toISOString()
      ),
      instagram: getNextOptimalTimes('instagram', new Date(), 5).map(date =>
        date.toISOString()
      ),
    }),
    []
  )

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const imageBuilder = imageUrlBuilder({ projectId, dataset })

  const getImageSchemaType = useCallback(
    (typeName: string) => {
      const type = schema.get(typeName) as ObjectSchemaType | undefined
      const field = type?.fields?.find(item => item.name === 'image')
      return field?.type as ImageSchemaType | undefined
    },
    [schema]
  )

  useEffect(() => {
    setLinkedinText(portableTextToPlainTextString(data.linkedin?.text))
    setFacebookText(portableTextToPlainTextString(data.facebook?.text))
    setInstagramCaption(portableTextToPlainTextString(data.instagram?.caption))
    setInstagramHashtags((data.instagram?.hashtags || []).join(', '))
    setSuggestedFirstComment(data.suggestedFirstComment || '')
  }, [data])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const getImageRef = useCallback(
    (channel: 'linkedin' | 'facebook' | 'instagram') => {
      const image = data[channel]?.image as
        | { asset?: { _ref?: string } }
        | undefined
      return image?.asset?._ref
    },
    [data]
  )

  const getImageUrl = useCallback(
    (channel: 'linkedin' | 'facebook' | 'instagram') => {
      const ref = getImageRef(channel)
      if (!ref) return null
      try {
        return imageBuilder
          .image({ asset: { _ref: ref } })
          .width(600)
          .url()
      } catch {
        return null
      }
    },
    [getImageRef, imageBuilder]
  )

  const applyImageFromMain = useCallback(
    async (channel: 'linkedin' | 'facebook' | 'instagram') => {
      if (!mainImageAssetRef) return
      await onSave(['distribution', 'social', channel, 'image'], {
        _type: 'image',
        asset: { _type: 'reference', _ref: mainImageAssetRef },
      })
      await onRefresh()
    },
    [mainImageAssetRef, onRefresh, onSave]
  )

  const clearImage = useCallback(
    async (channel: 'linkedin' | 'facebook' | 'instagram') => {
      await onSave(['distribution', 'social', channel, 'image'], null)
      await onRefresh()
    },
    [onRefresh, onSave]
  )

  const handleImageChange = useCallback(
    async (channel: 'linkedin' | 'facebook' | 'instagram', value: unknown) => {
      await onSave(['distribution', 'social', channel, 'image'], value || null)
      await onRefresh()
    },
    [onRefresh, onSave]
  )

  const handleGenerate = useCallback(
    async (channel: 'linkedin' | 'facebook' | 'instagram') => {
      if (!postId) {
        setError('Post information is missing. Please select a post.')
        return
      }
      if (rateLimitRemaining[channel] > 0) {
        setError(
          `Please wait ${rateLimitRemaining[channel]} seconds before generating ${channel}.`
        )
        return
      }
      setIsGenerating(prev => ({ ...prev, [channel]: true }))
      setError(null)
      try {
        const action =
          channel === 'linkedin'
            ? generateLinkedInDraft
            : channel === 'facebook'
              ? generateFacebookDraft
              : generateInstagramDraft
        const result = (await action(postId)) as {
          success: boolean
          error?: string
        }
        if (!result.success) {
          setError(result.error || `Failed to generate ${channel} draft.`)
          return
        }
        await onRefresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to generate ${channel} draft.`
        )
      } finally {
        setIsGenerating(prev => ({ ...prev, [channel]: false }))
      }
    },
    [onRefresh, postId, rateLimitRemaining]
  )

  const handleSchedule = useCallback(
    async (
      channel: 'linkedin' | 'facebook' | 'instagram',
      scheduledAt: string
    ) => {
      if (!postId) return
      setIsScheduling(true)
      setError(null)
      try {
        const content =
          channel === 'linkedin'
            ? linkedinText
            : channel === 'facebook'
              ? facebookText
              : instagramCaption
        const imageUrl = getImageUrl(channel) || undefined
        const result = await schedulePost(
          postId,
          channel,
          content,
          scheduledAt,
          imageUrl
        )
        if (!result.success) {
          setError(result.error || 'Failed to schedule post.')
          return
        }
        setSuccess('Post scheduled successfully.')
        setShowSchedulePicker(null)
        await onRefresh()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to schedule post.'
        )
      } finally {
        setIsScheduling(false)
      }
    },
    [
      facebookText,
      getImageUrl,
      instagramCaption,
      linkedinText,
      onRefresh,
      postId,
    ]
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const nextSocial: SocialData = {
        ...data,
        linkedin: {
          ...data.linkedin,
          text: plainTextToPortableText(linkedinText),
        },
        facebook: {
          ...data.facebook,
          text: plainTextToPortableText(facebookText),
        },
        instagram: {
          ...data.instagram,
          caption: plainTextToPortableText(instagramCaption),
          hashtags: instagramHashtags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
        },
        suggestedFirstComment: suggestedFirstComment.trim(),
      }
      await onSave(['distribution', 'social'], nextSocial)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }, [
    data,
    facebookText,
    instagramCaption,
    instagramHashtags,
    linkedinText,
    onSave,
    suggestedFirstComment,
  ])

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Text size={1} weight="bold">
          Social Drafts
        </Text>

        {error && (
          <Card padding={2} radius={2} tone="critical">
            <Text size={0}>{error}</Text>
          </Card>
        )}

        {success && (
          <Card padding={2} radius={2} tone="positive">
            <Text size={0}>{success}</Text>
          </Card>
        )}

        <Stack space={2}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="semibold">
              LinkedIn
            </Text>
            <Flex align="center" gap={2}>
              <Badge tone={linkedinText.trim() ? 'caution' : 'primary'}>
                {linkedinText.trim() ? 'ready' : 'idle'}
              </Badge>
              <Button
                text={
                  isGenerating.linkedin
                    ? 'Generating...'
                    : rateLimitRemaining.linkedin > 0
                      ? `Generate (${rateLimitRemaining.linkedin}s)`
                      : 'Generate'
                }
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => handleGenerate('linkedin')}
                disabled={
                  isGenerating.linkedin || rateLimitRemaining.linkedin > 0
                }
              />
              <Button
                text="Schedule LinkedIn Post"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => setShowSchedulePicker('linkedin')}
                disabled={!linkedinText.trim()}
              />
            </Flex>
          </Flex>
          <StandaloneSocialImageUploader
            label="Image (optional)"
            value={data.linkedin?.image as { _type?: 'image' } | undefined}
            imageSchemaType={getImageSchemaType('linkedinSocial')}
            onChange={value => handleImageChange('linkedin', value)}
            onUseMainImage={() => applyImageFromMain('linkedin')}
            onClearImage={() => clearImage('linkedin')}
            disableUseMainImage={!mainImageAssetRef}
            disableClearImage={!getImageRef('linkedin')}
          />
          <TextArea
            value={linkedinText}
            onChange={e => setLinkedinText(e.currentTarget.value)}
            rows={5}
          />
        </Stack>

        <Stack space={2}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="semibold">
              Facebook
            </Text>
            <Flex align="center" gap={2}>
              <Badge tone={facebookText.trim() ? 'caution' : 'primary'}>
                {facebookText.trim() ? 'ready' : 'idle'}
              </Badge>
              <Button
                text={
                  isGenerating.facebook
                    ? 'Generating...'
                    : rateLimitRemaining.facebook > 0
                      ? `Generate (${rateLimitRemaining.facebook}s)`
                      : 'Generate'
                }
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => handleGenerate('facebook')}
                disabled={
                  isGenerating.facebook || rateLimitRemaining.facebook > 0
                }
              />
              <Button
                text="Schedule Facebook Post"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => setShowSchedulePicker('facebook')}
                disabled={!facebookText.trim()}
              />
            </Flex>
          </Flex>
          <StandaloneSocialImageUploader
            label="Image (optional)"
            value={data.facebook?.image as { _type?: 'image' } | undefined}
            imageSchemaType={getImageSchemaType('facebookSocial')}
            onChange={value => handleImageChange('facebook', value)}
            onUseMainImage={() => applyImageFromMain('facebook')}
            onClearImage={() => clearImage('facebook')}
            disableUseMainImage={!mainImageAssetRef}
            disableClearImage={!getImageRef('facebook')}
          />
          <TextArea
            value={facebookText}
            onChange={e => setFacebookText(e.currentTarget.value)}
            rows={5}
          />
        </Stack>

        <Stack space={2}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="semibold">
              Instagram
            </Text>
            <Flex align="center" gap={2}>
              <Badge tone={instagramCaption.trim() ? 'caution' : 'primary'}>
                {instagramCaption.trim() ? 'ready' : 'idle'}
              </Badge>
              <Button
                text={
                  isGenerating.instagram
                    ? 'Generating...'
                    : rateLimitRemaining.instagram > 0
                      ? `Generate (${rateLimitRemaining.instagram}s)`
                      : 'Generate'
                }
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => handleGenerate('instagram')}
                disabled={
                  isGenerating.instagram || rateLimitRemaining.instagram > 0
                }
              />
              <Button
                text="Schedule Instagram Post"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => setShowSchedulePicker('instagram')}
                disabled={!instagramCaption.trim()}
              />
            </Flex>
          </Flex>
          <StandaloneSocialImageUploader
            label="Image (optional)"
            value={data.instagram?.image as { _type?: 'image' } | undefined}
            imageSchemaType={getImageSchemaType('instagramSocial')}
            onChange={value => handleImageChange('instagram', value)}
            onUseMainImage={() => applyImageFromMain('instagram')}
            onClearImage={() => clearImage('instagram')}
            disableUseMainImage={!mainImageAssetRef}
            disableClearImage={!getImageRef('instagram')}
          />
          <TextArea
            value={instagramCaption}
            onChange={e => setInstagramCaption(e.currentTarget.value)}
            rows={5}
          />
          <TextInput
            placeholder="Hashtags (comma separated)"
            value={instagramHashtags}
            onChange={e => setInstagramHashtags(e.currentTarget.value)}
          />
        </Stack>

        <Stack space={2}>
          <Text size={0} muted>
            Suggested First Comment
          </Text>
          <TextArea
            value={suggestedFirstComment}
            onChange={e => setSuggestedFirstComment(e.currentTarget.value)}
            rows={3}
          />
        </Stack>

        <ScheduleModal
          isOpen={Boolean(showSchedulePicker)}
          onClose={() => setShowSchedulePicker(null)}
          onSchedule={scheduledAt =>
            showSchedulePicker
              ? handleSchedule(showSchedulePicker, scheduledAt)
              : Promise.resolve()
          }
          channel={showSchedulePicker || 'linkedin'}
          recommendations={
            showSchedulePicker
              ? recommendations[showSchedulePicker]
              : recommendations.linkedin
          }
          loading={isScheduling}
          image={toSanityImageReference(
            (showSchedulePicker
              ? data[showSchedulePicker]?.image
              : data.linkedin?.image) as ImageValue | undefined
          )}
          textContent={
            showSchedulePicker === 'facebook'
              ? facebookText
              : showSchedulePicker === 'instagram'
                ? instagramCaption
                : linkedinText
          }
        />

        {scheduledPosts &&
          Array.isArray(scheduledPosts) &&
          scheduledPosts.length > 0 && (
            <Card padding={3} radius={2} tone="transparent" border>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Scheduled Posts
                </Text>
                <ScheduledPostsList
                  scheduledPosts={
                    scheduledPosts as Array<{
                      channel: 'linkedin' | 'facebook' | 'instagram'
                      content: string
                      scheduledAt: string
                      status: 'scheduled' | 'published' | 'failed'
                      platformPostId?: string
                      error?: string
                      publishedAt?: string
                      imageUrl?: string
                      image?: {
                        asset?: { _ref?: string; _type?: string }
                      }
                    }>
                  }
                />
              </Stack>
            </Card>
          )}

        <Flex justify="space-between" align="center">
          <Text size={0} muted>
            {data.generatedAt
              ? `Generated: ${new Date(data.generatedAt).toLocaleString()}`
              : 'Not generated yet'}
          </Text>
          <Button
            text={isSaving ? 'Saving...' : 'Save Social Drafts'}
            tone="primary"
            onClick={handleSave}
            disabled={isSaving}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
