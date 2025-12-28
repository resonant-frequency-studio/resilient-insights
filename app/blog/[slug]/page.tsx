import { client } from '@/sanity/lib/client'
import { postBySlugQuery, postSlugsQuery } from '@/lib/sanity/queries'
import { Post } from '@/types/sanity'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/blog"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Blog
        </Link>

        <article>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          {post.publishedAt && (
            <p className="text-gray-600 mb-6">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          {post.mainImage && (
            <div className="relative w-full h-96 mb-8">
              <Image
                src={urlFor(post.mainImage).width(800).height(400).url()}
                alt={post.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          {post.excerpt && (
            <p className="text-xl text-gray-700 mb-8 italic">{post.excerpt}</p>
          )}

          {post.body && (
            <div className="prose prose-lg max-w-none">
              <PortableText value={post.body} />
            </div>
          )}

          {post.author && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-xl font-semibold mb-2">About the Author</h3>
              <div className="flex items-center gap-4">
                {post.author.image && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={urlFor(post.author.image).width(64).height(64).url()}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{post.author.name}</p>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  )
}

