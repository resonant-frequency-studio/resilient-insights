import { render, screen } from '@testing-library/react'
import BlogPostPage, { generateMetadata, generateStaticParams } from '../page'
import { Post } from '@/types/sanity'
import { notFound } from 'next/navigation'

// Mock Next.js modules
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    className,
    fill,
  }: {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    fill?: boolean
  }) => {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        {...(fill
          ? { style: { position: 'absolute', inset: 0 } }
          : { width, height })}
      />
    )
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    const error = new Error('NEXT_NOT_FOUND')
    ;(error as { digest?: string }).digest = 'NEXT_NOT_FOUND'
    throw error
  }),
}))

// Mock PortableText
jest.mock('@portabletext/react', () => ({
  PortableText: ({ value }: { value: unknown }) => {
    // Simple mock that renders text from blocks
    if (Array.isArray(value)) {
      return (
        <div data-testid="portable-text">
          {value
            .filter(
              (block: unknown) =>
                (block as { _type?: string })._type === 'block'
            )
            .map((block: unknown) => {
              const b = block as { children?: Array<{ text?: string }> }
              return b.children?.map((child, i) => (
                <span key={i}>{child.text}</span>
              ))
            })}
        </div>
      )
    }
    return <div data-testid="portable-text" />
  },
}))

// Mock components
jest.mock('@/components/AudioPlayer', () => ({
  __esModule: true,
  default: ({ slug }: { slug: string }) => (
    <div data-testid="audio-player">Audio Player: {slug}</div>
  ),
}))

jest.mock('@/components/AuthorSidebar', () => ({
  __esModule: true,
  default: ({ author }: { author?: { name: string } }) => (
    <div data-testid="author-sidebar">
      Author: {author?.name || 'No author'}
    </div>
  ),
}))

// Mock Sanity queries
jest.mock('@/lib/sanity/queries', () => ({
  postBySlugQuery: 'mock-post-by-slug-query',
  postSlugsQuery: 'mock-post-slugs-query',
}))

// Mock Sanity client
jest.mock('@/sanity/lib/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}))

// Mock image URL builder
jest.mock('@/sanity/lib/image', () => ({
  urlFor: jest.fn(() => ({
    width: jest.fn((w: number) => ({
      height: jest.fn((h: number) => ({
        url: () => `https://cdn.sanity.io/images/test-image-${w}x${h}.jpg`,
      })),
      url: () => `https://cdn.sanity.io/images/test-image-${w}.jpg`,
    })),
  })),
}))

// Mock TTS utility
jest.mock('@/lib/tts/portableTextToSpeechText', () => ({
  portableTextToSpeechText: jest.fn((body: unknown) => {
    if (Array.isArray(body)) {
      return body
        .filter(
          (block: unknown) => (block as { _type?: string })._type === 'block'
        )
        .map((block: unknown) => {
          const b = block as { children?: Array<{ text?: string }> }
          return b.children?.map(child => child.text).join(' ')
        })
        .join(' ')
    }
    return ''
  }),
}))

import { client } from '@/sanity/lib/client'

const mockClient = client as jest.Mocked<typeof client>
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>

describe('Blog Post Page', () => {
  const mockPost: Post = {
    _id: '1',
    title: 'Test Blog Post',
    slug: { current: 'test-blog-post' },
    publishedAt: '2024-01-15T00:00:00Z',
    _updatedAt: '2024-01-16T00:00:00Z',
    excerpt: 'This is a test excerpt for the blog post',
    mainImage: {
      _type: 'image',
      asset: {
        _ref: 'image-1',
        _type: 'reference',
      },
    },
    body: [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'This is the first paragraph of the blog post.',
          },
        ],
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'This is the second paragraph.',
          },
        ],
      },
    ],
    author: {
      _id: 'author-1',
      name: 'John Doe',
      slug: { current: 'john-doe' },
      bio: [
        {
          _type: 'block',
          _key: 'bio1',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'John is a leadership expert.',
            },
          ],
        },
      ],
    },
    categories: [
      {
        _id: 'cat-1',
        title: 'Leadership',
        slug: { current: 'leadership' },
      },
      {
        _id: 'cat-2',
        title: 'Coaching',
        slug: { current: 'coaching' },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders post with all content (title, author, categories, body)', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPost)

    const component = await BlogPostPage({
      params: Promise.resolve({ slug: 'test-blog-post' }),
    })
    render(component)

    // Check title
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument()

    // Check author
    expect(screen.getByText(/written by JOHN DOE/i)).toBeInTheDocument()

    // Check categories
    expect(
      screen.getByText(/filed under LEADERSHIP \| COACHING/i)
    ).toBeInTheDocument()

    // Check body content
    expect(screen.getByTestId('portable-text')).toBeInTheDocument()
    expect(
      screen.getByText('This is the first paragraph of the blog post.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('This is the second paragraph.')
    ).toBeInTheDocument()
  })

  it('calls notFound() when post does not exist', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(null)

    // notFound() throws an error in Next.js
    await expect(
      BlogPostPage({ params: Promise.resolve({ slug: 'non-existent-post' }) })
    ).rejects.toThrow()

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('renders "Back to Articles" link', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPost)

    const component = await BlogPostPage({
      params: Promise.resolve({ slug: 'test-blog-post' }),
    })
    render(component)

    const backLink = screen.getByText('← Back to Articles')
    expect(backLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('displays AudioPlayer component', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPost)

    const component = await BlogPostPage({
      params: Promise.resolve({ slug: 'test-blog-post' }),
    })
    render(component)

    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
    expect(screen.getByText('Audio Player: test-blog-post')).toBeInTheDocument()
  })

  it('displays AuthorSidebar component', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPost)

    const component = await BlogPostPage({
      params: Promise.resolve({ slug: 'test-blog-post' }),
    })
    render(component)

    expect(screen.getByTestId('author-sidebar')).toBeInTheDocument()
    expect(screen.getByText('Author: John Doe')).toBeInTheDocument()
  })

  it('displays AuthorSidebar with no author when author is missing', async () => {
    const postWithoutAuthor: Post = {
      ...mockPost,
      author: undefined,
    }

    ;(mockClient.fetch as jest.Mock).mockResolvedValue(postWithoutAuthor)

    const component = await BlogPostPage({
      params: Promise.resolve({ slug: 'test-blog-post' }),
    })
    render(component)

    expect(screen.getByText('Author: No author')).toBeInTheDocument()
  })

  describe('generateMetadata', () => {
    it('generates metadata with all post data', async () => {
      ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPost)

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: 'test-blog-post' }),
      })

      expect(metadata.title).toBe(
        'Test Blog Post | by John Doe | Resilient Leadership'
      )
      expect(metadata.description).toBe(
        'This is a test excerpt for the blog post'
      )
      // Keywords include categories as comma-separated string plus default keywords
      expect(metadata.keywords).toContain('Leadership, Coaching')
      expect(metadata.keywords).toContain('leadership')
      expect(metadata.keywords).toContain('coaching')
      expect(metadata.authors).toEqual([{ name: 'John Doe' }])
      expect(metadata.openGraph?.title).toBe('Test Blog Post')
      expect((metadata.openGraph as { type?: string })?.type).toBe('article')
      expect((metadata.openGraph as { authors?: string[] })?.authors).toEqual([
        'John Doe',
      ])
      expect(metadata.twitter?.title).toBe('Test Blog Post')
    })

    it('generates metadata without author when author is missing', async () => {
      const postWithoutAuthor: Post = {
        ...mockPost,
        author: undefined,
      }

      ;(mockClient.fetch as jest.Mock).mockResolvedValue(postWithoutAuthor)

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: 'test-blog-post' }),
      })

      expect(metadata.title).toBe('Test Blog Post | Resilient Leadership')
      expect(metadata.authors).toBeUndefined()
      expect(
        (metadata.openGraph as { authors?: string[] })?.authors
      ).toBeUndefined()
    })

    it('generates metadata with body text when excerpt is missing', async () => {
      const postWithoutExcerpt: Post = {
        ...mockPost,
        excerpt: undefined,
      }

      ;(mockClient.fetch as jest.Mock).mockResolvedValue(postWithoutExcerpt)

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: 'test-blog-post' }),
      })

      expect(metadata.description).toContain('This is the first paragraph')
    })

    it('generates metadata for not found post', async () => {
      ;(mockClient.fetch as jest.Mock).mockResolvedValue(null)

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: 'non-existent' }),
      })

      expect(metadata.title).toBe('Article Not Found | Resilient Leadership')
      expect(metadata.description).toBe(
        'The requested article could not be found.'
      )
    })

    it('generates metadata with image when mainImage exists', async () => {
      ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPost)

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: 'test-blog-post' }),
      })

      expect(metadata.openGraph?.images).toBeDefined()
      const images = metadata.openGraph?.images
      if (Array.isArray(images) && images.length > 0) {
        const firstImage = images[0] as { url?: string }
        expect(firstImage?.url).toContain('cdn.sanity.io')
      } else if (images && typeof images === 'object' && 'url' in images) {
        expect((images as { url?: string }).url).toContain('cdn.sanity.io')
      }
      expect(metadata.twitter?.images).toBeDefined()
    })
  })

  describe('generateStaticParams', () => {
    it('generates static params from post slugs', async () => {
      const mockSlugs = [
        { slug: { current: 'post-1' } },
        { slug: { current: 'post-2' } },
        { slug: { current: 'post-3' } },
      ]

      ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockSlugs)

      const params = await generateStaticParams()

      expect(params).toEqual([
        { slug: 'post-1' },
        { slug: 'post-2' },
        { slug: 'post-3' },
      ])
    })

    it('handles empty slugs array', async () => {
      ;(mockClient.fetch as jest.Mock).mockResolvedValue([])

      const params = await generateStaticParams()

      expect(params).toEqual([])
    })
  })
})
