'use client'

import { useState } from 'react'
import {
  Dialog,
  Box,
  Stack,
  Button,
  Text,
  TextInput,
  Label,
  Card,
  Flex,
  Badge,
} from '@sanity/ui'
import {
  getPreviewImageUrl,
  getPlatformDimensionInfo,
  SanityImageReference,
  SocialPlatform,
} from '@/lib/social/imageOptimizer'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduledAt: string) => Promise<void>
  channel: SocialPlatform
  recommendations?: string[] // ISO 8601 datetime strings
  loading?: boolean
  image?: SanityImageReference // Sanity image reference for auto-cropping
  textContent?: string // Plain text content to preview
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  channel,
  recommendations = [],
  loading = false,
  image,
  textContent,
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [useRecommendation, setUseRecommendation] = useState<string | null>(
    null
  )
  const [imageLoadError, setImageLoadError] = useState(false)

  const handleSchedule = async () => {
    let scheduledAt: string

    if (useRecommendation) {
      scheduledAt = useRecommendation
    } else if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`)
      scheduledAt = dateTime.toISOString()
    } else {
      return
    }

    await onSchedule(scheduledAt)
  }

  const handleClose = () => {
    setSelectedDate('')
    setSelectedTime('')
    setUseRecommendation(null)
    setImageLoadError(false)
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]
  const channelLabel = channel.charAt(0).toUpperCase() + channel.slice(1)

  // Generate the platform-optimized preview URL
  const croppedPreviewUrl = getPreviewImageUrl(image, channel, 400)
  const dimensionInfo = getPlatformDimensionInfo(channel)

  // Check if we have any preview content
  const hasPreview = croppedPreviewUrl || textContent

  if (!isOpen) return null

  return (
    <Dialog
      id={`schedule-${channel}-modal`}
      header={`Schedule ${channelLabel} Post`}
      onClose={handleClose}
      zOffset={1000}
      width={1}
    >
      <Box padding={4}>
        <Stack space={4}>
          {/* Post Preview Section */}
          {hasPreview && (
            <Box>
              <Flex align="center" gap={2} marginBottom={2}>
                <Label size={1} muted>
                  Preview
                </Label>
                {croppedPreviewUrl && (
                  <Badge tone="primary" fontSize={0}>
                    {dimensionInfo}
                  </Badge>
                )}
              </Flex>

              <Card
                padding={3}
                radius={2}
                tone="transparent"
                border
                style={{
                  backgroundColor: 'var(--card-bg-color)',
                }}
              >
                <Stack space={3}>
                  {/* Image Preview */}
                  {croppedPreviewUrl && (
                    <Box
                      style={{
                        width: '100%',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      {imageLoadError ? (
                        <Flex
                          align="center"
                          justify="center"
                          padding={4}
                          style={{
                            backgroundColor: 'var(--card-muted-bg-color)',
                          }}
                        >
                          <Text size={0} muted>
                            Image failed to load
                          </Text>
                        </Flex>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={croppedPreviewUrl}
                          alt={`${channelLabel} preview`}
                          style={{
                            width: '100%',
                            display: 'block',
                          }}
                          onError={() => setImageLoadError(true)}
                          onLoad={() => setImageLoadError(false)}
                        />
                      )}
                    </Box>
                  )}

                  {/* Text Preview */}
                  {textContent && (
                    <Box
                      style={{
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      <Text
                        size={1}
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                        }}
                      >
                        {textContent}
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Card>

              {croppedPreviewUrl && (
                <Text size={0} muted style={{ marginTop: '4px' }}>
                  Image auto-cropped for {channelLabel}
                </Text>
              )}
            </Box>
          )}

          {/* Recommended Times */}
          {recommendations.length > 0 && (
            <Box>
              <Label size={1} muted>
                Recommended Times
              </Label>
              <Stack space={2} marginTop={2}>
                {recommendations.map((rec, index) => (
                  <Card
                    key={index}
                    padding={2}
                    radius={1}
                    tone={useRecommendation === rec ? 'primary' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setUseRecommendation(rec)
                      setSelectedDate('')
                      setSelectedTime('')
                    }}
                  >
                    <Text size={1}>{new Date(rec).toLocaleString()}</Text>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Custom Date/Time Picker */}
          <Box>
            <Label size={1} muted>
              {recommendations.length > 0
                ? 'Or choose custom date and time'
                : 'Choose date and time'}
            </Label>
            <Flex gap={2} marginTop={2}>
              <Box flex={1}>
                <TextInput
                  type="date"
                  value={selectedDate}
                  onChange={e => {
                    setSelectedDate(e.currentTarget.value)
                    setUseRecommendation(null)
                  }}
                  min={today}
                />
              </Box>
              <Box flex={1}>
                <TextInput
                  type="time"
                  value={selectedTime}
                  onChange={e => {
                    setSelectedTime(e.currentTarget.value)
                    setUseRecommendation(null)
                  }}
                />
              </Box>
            </Flex>
          </Box>

          {/* Action Buttons */}
          <Flex gap={2} justify="flex-end" marginTop={2}>
            <Button text="Cancel" mode="ghost" onClick={handleClose} />
            <Button
              text={loading ? 'Scheduling...' : 'Submit'}
              tone="primary"
              onClick={handleSchedule}
              disabled={
                loading ||
                (!useRecommendation && (!selectedDate || !selectedTime))
              }
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
