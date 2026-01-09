'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Stack,
  Button,
  Text,
  Card,
  Flex,
  Spinner,
  Label,
} from '@sanity/ui'

interface RecommendationsListProps {
  channel: 'linkedin' | 'facebook' | 'instagram'
  date: Date
  onSelectTime: (time: string) => void
}

export function RecommendationsList({
  channel,
  date,
  onSelectTime,
}: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const dateStr = date.toISOString().split('T')[0]
      const API_BASE_URL =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:3000'
      const DISTRIBUTION_SECRET =
        process.env.NEXT_PUBLIC_DISTRIBUTION_SECRET || ''

      const response = await fetch(
        `${API_BASE_URL}/api/distribution/recommendations?channel=${channel}&date=${dateStr}`,
        {
          headers: {
            'X-DISTRIBUTION-SECRET': DISTRIBUTION_SECRET,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [channel, date])

  if (loading) {
    return (
      <Card padding={3} radius={2}>
        <Flex align="center" gap={2}>
          <Spinner />
          <Text size={1}>Loading recommendations...</Text>
        </Flex>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding={3} radius={2} tone="critical">
        <Stack space={2}>
          <Text size={1}>{error}</Text>
          <Button text="Retry" mode="ghost" onClick={fetchRecommendations} />
        </Stack>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card padding={3} radius={2}>
        <Text size={1} muted>
          No recommendations available
        </Text>
      </Card>
    )
  }

  return (
    <Stack space={2}>
      <Label size={1} muted>
        Recommended Posting Times
      </Label>
      <Stack space={2}>
        {recommendations.map((rec, index) => (
          <Card
            key={index}
            padding={2}
            radius={1}
            tone="default"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectTime(rec)}
          >
            <Flex align="center" justify="space-between">
              <Text size={1}>{new Date(rec).toLocaleString()}</Text>
              <Button text="Select" mode="ghost" fontSize={0} />
            </Flex>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}
