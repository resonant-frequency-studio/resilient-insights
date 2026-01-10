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
} from '@sanity/ui'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduledAt: string) => Promise<void>
  channel: 'linkedin' | 'facebook' | 'instagram'
  recommendations?: string[] // ISO 8601 datetime strings
  loading?: boolean
  imageUrl?: string // Optional preview of image from draft
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  channel,
  recommendations = [],
  loading = false,
  imageUrl,
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
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]
  const channelLabel = channel.charAt(0).toUpperCase() + channel.slice(1)

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

          {/* Image Preview */}
          {imageUrl && (
            <Box>
              <Label size={1} muted>
                Image (from draft)
              </Label>
              <Card
                padding={3}
                radius={2}
                tone="transparent"
                border
                marginTop={2}
              >
                <Box
                  style={{
                    width: '100%',
                    maxHeight: '150px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--card-bg-color)',
                    minHeight: '80px',
                  }}
                >
                  {imageLoadError ? (
                    <Text size={0} muted>
                      Image failed to load
                    </Text>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: '150px',
                        objectFit: 'contain',
                      }}
                      onError={() => setImageLoadError(true)}
                      onLoad={() => setImageLoadError(false)}
                    />
                  )}
                </Box>
              </Card>
            </Box>
          )}

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
