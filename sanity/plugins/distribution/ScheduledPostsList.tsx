'use client'

import { Box, Stack, Text, Badge, Card, Flex, Button } from '@sanity/ui'

interface ScheduledPost {
  channel: 'linkedin' | 'facebook' | 'instagram'
  content: string
  scheduledAt: string
  status: 'scheduled' | 'published' | 'failed'
  platformPostId?: string
  error?: string
  publishedAt?: string
  imageUrl?: string
  image?: {
    asset?: {
      _ref?: string
      _type?: string
    }
  }
}

interface ScheduledPostsListProps {
  scheduledPosts: ScheduledPost[]
  onCancel?: (index: number) => void
}

export function ScheduledPostsList({
  scheduledPosts,
  onCancel,
}: ScheduledPostsListProps) {
  if (scheduledPosts.length === 0) {
    return (
      <Card padding={3} radius={2}>
        <Text size={1} muted>
          No scheduled posts
        </Text>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    let tone: 'primary' | 'positive' | 'critical' | 'caution' = 'primary'
    if (status === 'published') tone = 'positive'
    if (status === 'failed') tone = 'critical'
    if (status === 'scheduled') tone = 'caution'
    return (
      <Badge mode="outline" tone={tone} fontSize={0}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <Stack space={3}>
      {scheduledPosts.map((post, index) => (
        <Card key={index} padding={3} radius={2} shadow={1}>
          <Stack space={2}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={2}>
                <Text size={1} weight="semibold">
                  {post.channel.charAt(0).toUpperCase() + post.channel.slice(1)}
                </Text>
                {getStatusBadge(post.status)}
              </Flex>
              {post.status === 'scheduled' && onCancel && (
                <Button
                  text="Cancel"
                  mode="ghost"
                  tone="critical"
                  fontSize={0}
                  onClick={() => onCancel(index)}
                />
              )}
            </Flex>

            <Text size={0} muted>
              Scheduled: {new Date(post.scheduledAt).toLocaleString()}
            </Text>

            {post.publishedAt && (
              <Text size={0} muted>
                Published: {new Date(post.publishedAt).toLocaleString()}
              </Text>
            )}

            {post.platformPostId && (
              <Text size={0} muted>
                Post ID: {post.platformPostId}
              </Text>
            )}

            {(post.imageUrl || post.image) && (
              <Box>
                <Text size={0} muted>
                  Image: {post.imageUrl || 'Image attached'}
                </Text>
              </Box>
            )}

            <Box>
              <Text size={1} style={{ whiteSpace: 'pre-wrap' }}>
                {post.content.substring(0, 200)}
                {post.content.length > 200 ? '...' : ''}
              </Text>
            </Box>

            {post.error && (
              <Card padding={2} radius={1} tone="critical">
                <Text size={0}>Error: {post.error}</Text>
              </Card>
            )}
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}
