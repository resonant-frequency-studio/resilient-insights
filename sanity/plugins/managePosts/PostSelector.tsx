'use client'

import { Card, Flex, Label, Select, Stack, Text } from '@sanity/ui'

interface PostSelectorProps {
  posts: Array<{ _id: string; title?: string }>
  selectedPostId: string
  onChange: (postId: string) => void
  loading?: boolean
}

export function PostSelector({
  posts,
  selectedPostId,
  onChange,
  loading = false,
}: PostSelectorProps) {
  return (
    <Card padding={3} radius={2} border>
      <Stack space={2}>
        <Label size={1}>Post</Label>
        {loading ? (
          <Text size={1} muted>
            Loading posts...
          </Text>
        ) : (
          <Flex gap={2} align="center">
            <Select
              value={selectedPostId}
              onChange={event => onChange(event.currentTarget.value)}
            >
              {posts.length === 0 && (
                <option value="">No posts available</option>
              )}
              {posts.map(post => (
                <option key={post._id} value={post._id}>
                  {post.title || 'Untitled post'}
                </option>
              ))}
            </Select>
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
