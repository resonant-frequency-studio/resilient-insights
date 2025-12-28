import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Resilient Insights</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to our blog powered by Next.js and Sanity CMS.
        </p>
        <Link
          href="/blog"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Blog Posts
        </Link>
        <div className="mt-8">
          <Link
            href="/studio"
            className="text-blue-600 hover:underline"
          >
            Go to Sanity Studio →
          </Link>
        </div>
      </div>
    </main>
  )
}

