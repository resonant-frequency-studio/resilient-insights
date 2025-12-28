import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/lib/sanity/queries'
import { Post } from '@/types/sanity'
import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

async function getPosts(): Promise<Post[]> {
  return await client.fetch(postsQuery)
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No blog posts yet.</p>
            <Link
              href="/studio"
              className="text-blue-600 hover:underline"
            >
              Create your first post in Sanity Studio →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {post.mainImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={urlFor(post.mainImage).width(400).height(200).url()}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

