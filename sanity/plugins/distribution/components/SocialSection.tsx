'use client'

import { Card, Stack, Button, Text, Flex, Label, TextArea } from '@sanity/ui'
import { set, PatchEvent, unset, setIfMissing } from 'sanity'
import imageUrlBuilder from '@sanity/image-url'
import { useMemo } from 'react'

interface SocialImage {
  asset?: { _ref?: string; _type?: string }
  _type?: string
  alt?: string
}

interface SocialData {
  linkedin?: {
    text?: string
    image?: SocialImage
  }
  facebook?: {
    text?: string
    image?: SocialImage
  }
  instagram?: {
    caption?: string
    hashtags?: string[]
    image?: SocialImage
  }
  suggestedFirstComment?: string
}

interface SocialSectionProps {
  social: SocialData
  onChange?: (event: PatchEvent) => void
  mainImageAssetRef?: string
}

function getImageUrl(image?: SocialImage): string | null {
  if (!image?.asset?._ref) return null
  try {
    const builder = imageUrlBuilder({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    })
    return builder.image(image).width(1200).quality(80).url()
  } catch {
    return null
  }
}

export function SocialSection({
  social,
  onChange,
  mainImageAssetRef,
}: SocialSectionProps) {
  const linkedinImageUrl = useMemo(
    () => getImageUrl(social?.linkedin?.image),
    [social?.linkedin?.image]
  )
  const facebookImageUrl = useMemo(
    () => getImageUrl(social?.facebook?.image),
    [social?.facebook?.image]
  )
  const instagramImageUrl = useMemo(
    () => getImageUrl(social?.instagram?.image),
    [social?.instagram?.image]
  )

  const handleUseMainImage = (
    platform: 'linkedin' | 'facebook' | 'instagram'
  ) => {
    if (!mainImageAssetRef || !onChange) return
    const next = {
      _type: 'image',
      asset: { _type: 'reference', _ref: mainImageAssetRef },
    }
    onChange(
      PatchEvent.from([
        setIfMissing({}, ['social']),
        setIfMissing({}, ['social', platform]),
        set(next, ['social', platform, 'image']),
      ])
    )
  }

  const handleRemoveImage = (
    platform: 'linkedin' | 'facebook' | 'instagram'
  ) => {
    if (!onChange) return
    onChange(
      PatchEvent.from([
        setIfMissing({}, ['social']),
        setIfMissing({}, ['social', platform]),
        unset(['social', platform, 'image']),
      ])
    )
  }

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Text size={1} weight="bold">
          Social Media
        </Text>

        {/* LinkedIn */}
        {social?.linkedin !== undefined && (
          <Stack space={3}>
            <Text size={1} weight="semibold">
              LinkedIn
            </Text>

            <Stack space={2}>
              <Label>Text</Label>
              <TextArea
                value={social.linkedin.text || ''}
                onChange={e => {
                  if (onChange) {
                    onChange(
                      PatchEvent.from(
                        set(e.currentTarget.value, [
                          'social',
                          'linkedin',
                          'text',
                        ])
                      )
                    )
                  }
                }}
                rows={6}
              />
            </Stack>

            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Label>Image (optional)</Label>
                <Flex gap={2}>
                  {mainImageAssetRef && (
                    <Button
                      mode="ghost"
                      text="Use main image"
                      fontSize={0}
                      padding={1}
                      onClick={() => handleUseMainImage('linkedin')}
                    />
                  )}
                  {linkedinImageUrl && (
                    <Button
                      mode="ghost"
                      tone="critical"
                      text="Remove"
                      fontSize={0}
                      padding={1}
                      onClick={() => handleRemoveImage('linkedin')}
                    />
                  )}
                </Flex>
              </Flex>
              {linkedinImageUrl && (
                <div
                  style={{
                    maxWidth: '100%',
                    maxHeight: 260,
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={linkedinImageUrl}
                    alt={social.linkedin.image?.alt || 'LinkedIn image preview'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 260,
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              )}
              {!linkedinImageUrl && (
                <Text size={0} muted>
                  No image selected. Use &quot;Use main image&quot; or select
                  from Sanity&apos;s image picker below.
                </Text>
              )}
            </Stack>
          </Stack>
        )}

        {/* Facebook */}
        {social?.facebook !== undefined && (
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Facebook
            </Text>

            <Stack space={2}>
              <Label>Text</Label>
              <TextArea
                value={social.facebook.text || ''}
                onChange={e => {
                  if (onChange) {
                    onChange(
                      PatchEvent.from(
                        set(e.currentTarget.value, [
                          'social',
                          'facebook',
                          'text',
                        ])
                      )
                    )
                  }
                }}
                rows={6}
              />
            </Stack>

            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Label>Image (optional)</Label>
                <Flex gap={2}>
                  {mainImageAssetRef && (
                    <Button
                      mode="ghost"
                      text="Use main image"
                      fontSize={0}
                      padding={1}
                      onClick={() => handleUseMainImage('facebook')}
                    />
                  )}
                  {facebookImageUrl && (
                    <Button
                      mode="ghost"
                      tone="critical"
                      text="Remove"
                      fontSize={0}
                      padding={1}
                      onClick={() => handleRemoveImage('facebook')}
                    />
                  )}
                </Flex>
              </Flex>
              {facebookImageUrl && (
                <div
                  style={{
                    maxWidth: '100%',
                    maxHeight: 260,
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={facebookImageUrl}
                    alt={social.facebook.image?.alt || 'Facebook image preview'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 260,
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              )}
              {!facebookImageUrl && (
                <Text size={0} muted>
                  No image selected. Use &quot;Use main image&quot; or select
                  from Sanity&apos;s image picker below.
                </Text>
              )}
            </Stack>
          </Stack>
        )}

        {/* Instagram */}
        {social?.instagram !== undefined && (
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Instagram
            </Text>

            <Stack space={2}>
              <Label>Caption</Label>
              <TextArea
                value={social.instagram.caption || ''}
                onChange={e => {
                  if (onChange) {
                    onChange(
                      PatchEvent.from(
                        set(e.currentTarget.value, [
                          'social',
                          'instagram',
                          'caption',
                        ])
                      )
                    )
                  }
                }}
                rows={6}
              />
            </Stack>

            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Label>Image (optional)</Label>
                <Flex gap={2}>
                  {mainImageAssetRef && (
                    <Button
                      mode="ghost"
                      text="Use main image"
                      fontSize={0}
                      padding={1}
                      onClick={() => handleUseMainImage('instagram')}
                    />
                  )}
                  {instagramImageUrl && (
                    <Button
                      mode="ghost"
                      tone="critical"
                      text="Remove"
                      fontSize={0}
                      padding={1}
                      onClick={() => handleRemoveImage('instagram')}
                    />
                  )}
                </Flex>
              </Flex>
              {instagramImageUrl && (
                <div
                  style={{
                    maxWidth: '100%',
                    maxHeight: 260,
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={instagramImageUrl}
                    alt={
                      social.instagram.image?.alt || 'Instagram image preview'
                    }
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 260,
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              )}
              {!instagramImageUrl && (
                <Text size={0} muted>
                  No image selected. Use &quot;Use main image&quot; or select
                  from Sanity&apos;s image picker below.
                </Text>
              )}
            </Stack>

            {social.instagram.hashtags &&
              social.instagram.hashtags.length > 0 && (
                <Stack space={2}>
                  <Label>Hashtags</Label>
                  <Text size={0} muted>
                    {social.instagram.hashtags.join(', ')}
                  </Text>
                </Stack>
              )}
          </Stack>
        )}

        {/* Suggested First Comment */}
        {social?.suggestedFirstComment && (
          <Stack space={2}>
            <Label>Suggested First Comment</Label>
            <TextArea value={social.suggestedFirstComment} readOnly rows={3} />
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
