'use client'

import { useState } from 'react'
import {
  Box,
  Stack,
  Button,
  Text,
  TextInput,
  Label,
  Card,
  Flex,
} from '@sanity/ui'

interface SchedulePickerProps {
  onSchedule: (scheduledAt: string) => void
  onCancel: () => void
  channel: 'linkedin' | 'facebook' | 'instagram'
  recommendations?: string[] // ISO 8601 datetime strings
  loading?: boolean
  selectedImageUrl?: string // Read-only preview of image from draft
}

export function SchedulePicker({
  onSchedule,
  onCancel,
  channel,
  recommendations = [],
  loading = false,
  selectedImageUrl,
}: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [useRecommendation, setUseRecommendation] = useState<string | null>(
    null
  )
  const [imageLoadError, setImageLoadError] = useState<boolean>(false)

  const handleSchedule = () => {
    let scheduledAt: string

    if (useRecommendation) {
      scheduledAt = useRecommendation
    } else if (selectedDate && selectedTime) {
      // Combine date and time
      const dateTime = new Date(`${selectedDate}T${selectedTime}`)
      scheduledAt = dateTime.toISOString()
    } else {
      return // Invalid
    }

    onSchedule(scheduledAt)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Card padding={3} radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={1} weight="semibold">
          Schedule {channel.charAt(0).toUpperCase() + channel.slice(1)} Post
        </Text>

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
                  onClick={() => setUseRecommendation(rec)}
                >
                  <Text size={1}>{new Date(rec).toLocaleString()}</Text>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        <Box>
          <Label size={1} muted>
            Or choose custom date and time
          </Label>
          <Flex gap={2} marginTop={2}>
            <Box flex={1}>
              <TextInput
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.currentTarget.value)}
                min={today}
              />
            </Box>
            <Box flex={1}>
              <TextInput
                type="time"
                value={selectedTime}
                onChange={e => setSelectedTime(e.currentTarget.value)}
              />
            </Box>
          </Flex>
        </Box>

        {/* Read-only Image Preview */}
        {selectedImageUrl && (
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
                  <Stack space={2} padding={3}>
                    <Text size={0} muted align="center">
                      Image failed to load
                    </Text>
                  </Stack>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedImageUrl}
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

        <Flex gap={2} justify="flex-end">
          <Button text="Cancel" mode="ghost" onClick={onCancel} />
          <Button
            text={loading ? 'Scheduling...' : 'Schedule'}
            tone="primary"
            onClick={handleSchedule}
            disabled={
              loading ||
              (!useRecommendation && (!selectedDate || !selectedTime))
            }
          />
        </Flex>
      </Stack>
    </Card>
  )
}
