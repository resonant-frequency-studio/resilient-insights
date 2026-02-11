'use client'

import { useCallback, useEffect, useState } from 'react'
import { Box, Card, Flex, Stack, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { ManagePostsLayout } from './ManagePostsLayout'
import { PostSelector } from './PostSelector'

interface PostSummary {
  _id: string
  title?: string
}

interface PostDocument {
  _id: string
  title?: string
  slug?: { current?: string }
  excerpt?: string
  body?: unknown
  mainImage?: unknown
  author?: { name?: string }
  categories?: Array<{ title?: string }>
  distribution?: {
    newsletter?: Record<string, unknown>
    social?: Record<string, unknown>
    medium?: Record<string, unknown>
    scheduledPosts?: Array<Record<string, unknown>>
    socialAccounts?: Record<string, unknown>
  }
}

// Filter out draft versions to avoid duplicates (drafts have "drafts." prefix)
const POSTS_QUERY =
  '*[_type == "post" && !(_id in path("drafts.**"))]|order(publishedAt desc)[0...200]{_id,title}'
const POST_QUERY =
  '*[_type == "post" && _id == $id][0]{_id,title,slug,excerpt,body,mainImage,author->{name},categories[]->{title},distribution}'

export function ManagePostsTool() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string>('')
  const [post, setPost] = useState<PostDocument | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingPost, setLoadingPost] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true)
    setError(null)
    try {
      const results = await client.fetch<PostSummary[]>(POSTS_QUERY)
      setPosts(results)
      if (results.length > 0) {
        setSelectedPostId(prev => prev || results[0]._id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoadingPosts(false)
    }
  }, [client])

  const fetchPost = useCallback(
    async (postId: string) => {
      setLoadingPost(true)
      setError(null)
      try {
        const result = await client.fetch<PostDocument>(POST_QUERY, {
          id: postId,
        })
        setPost(result || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post')
      } finally {
        setLoadingPost(false)
      }
    },
    [client]
  )

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    if (selectedPostId) {
      fetchPost(selectedPostId)
    } else {
      setPost(null)
    }
  }, [fetchPost, selectedPostId])

  return (
    <Box
      padding={4}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Flex direction="column" gap={4} style={{ flex: 1, minHeight: 0 }}>
        <Card padding={3} radius={2} border>
          <Flex align="center" justify="space-between" gap={3}>
            <Stack space={2}>
              <Text size={2} weight="bold">
                Manage Social
              </Text>
              <Text size={1} muted>
                Select a post to manage distribution content and scheduling.
              </Text>
            </Stack>
          </Flex>
        </Card>

        <PostSelector
          posts={posts}
          selectedPostId={selectedPostId}
          onChange={setSelectedPostId}
          loading={loadingPosts}
        />

        {error && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{error}</Text>
          </Card>
        )}

        <Box style={{ flex: 1, minHeight: 0 }}>
          <ManagePostsLayout post={post} loading={loadingPost} />
        </Box>
      </Flex>
    </Box>
  )
}
