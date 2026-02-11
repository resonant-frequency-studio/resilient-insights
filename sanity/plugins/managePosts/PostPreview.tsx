'use client'

import { Box, Card, Flex, Stack, Text } from '@sanity/ui'
import imageUrlBuilder from '@sanity/image-url'
import { PortableText } from '@portabletext/react'
import type { TypedObject } from '@portabletext/types'

interface PostPreviewProps {
  post: {
    title?: string
    slug?: { current?: string }
    excerpt?: string
    body?: TypedObject[]
    mainImage?: { asset?: { _ref?: string } }
    author?: { name?: string }
    categories?: Array<{ title?: string }>
  }
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

const imageBuilder = imageUrlBuilder({
  projectId,
  dataset,
})

export function PostPreview({ post }: PostPreviewProps) {
  const imageUrl = post.mainImage?.asset?._ref
    ? imageBuilder.image(post.mainImage).width(800).url()
    : null

  return (
    <Card padding={3} radius={2} border style={{ height: 'fit-content' }}>
      <Stack space={3}>
        <Stack space={1}>
          <Text size={2} weight="bold">
            {post.title || 'Untitled post'}
          </Text>
          {post.author?.name && (
            <Text size={1} muted>
              By {post.author.name}
            </Text>
          )}
          {post.slug?.current && (
            <Text size={0} muted>
              Slug: {post.slug.current}
            </Text>
          )}
        </Stack>

        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={post.title || 'Post image'}
            style={{
              width: '100%',
              borderRadius: '6px',
              maxHeight: '220px',
              objectFit: 'cover',
            }}
          />
        )}

        {post.excerpt && (
          <Card padding={2} radius={2} tone="transparent" border>
            <Text size={1}>{post.excerpt}</Text>
          </Card>
        )}

        {post.categories && post.categories.length > 0 && (
          <Flex gap={2} wrap="wrap">
            {post.categories.map((category, index) => (
              <Card
                key={`${category.title || 'category'}-${index}`}
                padding={2}
                radius={2}
                tone="transparent"
                border
              >
                <Text size={0}>{category.title || 'Category'}</Text>
              </Card>
            ))}
          </Flex>
        )}

        <Box
          style={{
            borderTop: '1px solid var(--card-border-color)',
            paddingTop: '12px',
          }}
        >
          <Text size={1} weight="bold">
            Post Body (Read-Only)
          </Text>
          <Box style={{ marginTop: '8px' }}>
            {post.body ? (
              <PortableText value={post.body} />
            ) : (
              <Text size={1} muted>
                No body content available.
              </Text>
            )}
          </Box>
        </Box>
      </Stack>
    </Card>
  )
}
