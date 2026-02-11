import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/lib/sanity/queries'
import { Post } from '@/types/sanity'
import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import Typography from '@/components/Typography'

export const metadata: Metadata = {
  title: 'Articles | Resilient Leadership',
  description:
    'Leadership insights and practical reflections for executives and teams navigating complexity, responsibility, and change.',
  openGraph: {
    title: 'Articles | Resilient Leadership',
    description:
      'Leadership insights and practical reflections for executives and teams navigating complexity, responsibility, and change.',
    type: 'website',
    siteName: 'Resilient Leadership',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles | Resilient Leadership',
    description:
      'Leadership insights and practical reflections for executives and teams navigating complexity, responsibility, and change.',
  },
}

async function getPosts(): Promise<Post[]> {
  return await client.fetch(postsQuery)
}

// Helper function to extract first few lines of text from PortableText
function extractPreviewText(body: unknown, maxLength: number = 150): string {
  if (!body || !Array.isArray(body)) return ''

  let text = ''
  for (const block of body) {
    if (block._type === 'block' && block.children) {
      for (const child of block.children) {
        if (child._type === 'span' && child.text) {
          text += child.text
          if (text.length >= maxLength) {
            return (
              text
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, maxLength)
                .trimEnd() + '...'
            )
          }
        }
      }
      text += ' '
    }
  }
  return text.replace(/\s+/g, ' ').trim()
}

// Helper function to group posts by category
function groupPostsByCategory(posts: Post[]): Record<string, Post[]> {
  const grouped: Record<string, Post[]> = {}

  posts.forEach(post => {
    const category =
      post.categories && post.categories.length > 0
        ? post.categories[0].title
        : 'Uncategorized'

    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(post)
  })

  return grouped
}

export default async function Home() {
  const posts = await getPosts()
  const groupedPosts = groupPostsByCategory(posts)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* Page Title and Subcopy - Center Aligned */}
      <div className="text-center mb-12 md:mb-16">
        <Typography variant="heading-1" as="h1" className="mb-4">
          Resilient Insights for Thoughtful Leaders
        </Typography>
        <Typography
          variant="body-large"
          as="p"
          className="max-w-2xl mx-auto text-foreground-dark/80"
        >
          Practical reflections on leadership, resilience, and growth—for
          navigating complexity with clarity and confidence.
        </Typography>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Typography
            variant="body"
            as="p"
            className="mb-4 text-foreground-dark/60"
          >
            No blog posts yet.
          </Typography>
          <Link href="/studio" className="text-button-primary hover:underline">
            Create your first post in Sanity Studio →
          </Link>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedPosts).map(([category, categoryPosts]) => (
            <section key={category}>
              {/* Category Header */}
              <Typography
                variant="heading-3"
                as="h2"
                className="mb-8 uppercase tracking-wider"
              >
                {category}
              </Typography>

              {/* Articles in this category */}
              <div className="space-y-0">
                {categoryPosts.map((post, index) => {
                  const previewText = post.body
                    ? extractPreviewText(post.body, 200)
                    : post.excerpt || ''

                  const isLast = index === categoryPosts.length - 1

                  return (
                    <div key={post._id}>
                      <Link
                        href={`/${post.slug.current}`}
                        className="block group"
                      >
                        <article className="flex flex-col md:flex-row gap-6 md:gap-8 pb-8">
                          {/* Article Content */}
                          <div className="flex-1 min-w-0">
                            <Typography
                              variant="heading-4"
                              as="h3"
                              className="mb-3 group-hover:text-button-primary transition-colors"
                            >
                              {post.title}
                            </Typography>

                            {previewText && (
                              <Typography
                                variant="body"
                                as="p"
                                className="text-foreground-dark/70 line-clamp-3 mb-4"
                              >
                                {previewText}
                              </Typography>
                            )}

                            {/* Date - Bottom Left */}
                            {post.publishedAt && (
                              <Typography
                                variant="body-small"
                                as="p"
                                className="text-foreground-dark/50"
                              >
                                {new Date(post.publishedAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  }
                                )}
                              </Typography>
                            )}
                          </div>

                          {/* Article Image */}
                          {post.mainImage && (
                            <div className="relative w-full md:w-64 h-48 md:h-40 shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={urlFor(post.mainImage)
                                  .width(400)
                                  .height(300)
                                  .url()}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                        </article>
                      </Link>

                      {/* Dividing Line - Only if not last article */}
                      {!isLast && categoryPosts.length > 1 && (
                        <div className="h-px bg-checkbox-border mb-8" />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
