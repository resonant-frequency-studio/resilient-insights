import { client } from '@/sanity/lib/client'
import { postBySlugQuery, postSlugsQuery } from '@/lib/sanity/queries'
import { Post } from '@/types/sanity'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import AuthorSidebar from '@/components/AuthorSidebar'
import Typography from '@/components/Typography'
import AudioPlayer from '@/components/AudioPlayer'
import { urlFor } from '@/sanity/lib/image'

async function getPost(slug: string): Promise<Post | null> {
  return await client.fetch(postBySlugQuery, { slug })
}

async function getPostSlugs() {
  const slugs = await client.fetch(postSlugsQuery)
  return slugs.map((post: { slug: { current: string } }) => post.slug.current)
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug: string) => ({ slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const categoriesText = post.categories?.map(cat => cat.title.toUpperCase()).join(' | ') || ''

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* Back Link */}
      <Link href="/" className="hover:text-button-primary transition-colors mb-6 inline-block">
        <Typography variant="body-small" as="span">
          ← Back to Articles
        </Typography>
      </Link>

      <div className="flex flex-col md:flex-row gap-8 md:gap-0">
        {/* Main Article Content - Left Column */}
        <article className="flex-1 min-w-0 md:pr-12 md:border-r md:border-checkbox-border">
          {/* Title */}
          <Typography variant="heading-1" as="h1" className="mb-4">
            {post.title}
          </Typography>

          {/* Author and Categories */}
          <div className="mb-6 space-y-1">
            {post.author && (
              <div>
                <Typography variant="body-small" as="span" className="font-medium">
                  written by {post.author.name.toUpperCase()}
                </Typography>
              </div>
            )}
            {categoriesText && (
              <div>
                <Typography variant="body-small" as="span">
                  filed under {categoriesText}
                </Typography>
              </div>
            )}
          </div>

          {/* Listen to Article Button */}
          <div className="mb-8">
            <AudioPlayer slug={slug} />
          </div>

          {/* Separator */}
          <div className="h-px bg-checkbox-border mb-8" />

          {/* Article Body */}
          {post.body && (
            <div className="article-content">
              <PortableText
                value={post.body}
                components={{
                  types: {
                    image: ({ value }: { value?: { asset?: { _ref?: string }; alt?: string } }) => {
                      if (!value?.asset) return null
                      return (
                        <div className="my-8">
                          <Image
                            src={urlFor(value).width(1200).url()}
                            alt={value.alt || 'Article image'}
                            width={1200}
                            height={600}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      )
                    },
                  },
                }}
              />
            </div>
          )}
        </article>

        {/* Author Sidebar - Right Column (Desktop) / Bottom (Mobile) */}
        <aside className="md:order-last order-first md:pl-12">
          <AuthorSidebar author={post.author} />
        </aside>
      </div>
    </div>
  )
}
