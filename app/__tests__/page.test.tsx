import { render, screen } from '@testing-library/react'
import Home, { metadata } from '../page'
import { Post } from '@/types/sanity'

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

// Mock Sanity queries
jest.mock('@/lib/sanity/queries', () => ({
  postsQuery: 'mock-posts-query',
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
    width: jest.fn(() => ({
      height: jest.fn(() => ({
        url: () => 'https://cdn.sanity.io/images/test-image.jpg',
      })),
    })),
  })),
}))

import { client } from '@/sanity/lib/client'

const mockClient = client as jest.Mocked<typeof client>

describe('Home Page', () => {
  const mockPosts: Post[] = [
    {
      _id: '1',
      title: 'Test Post 1',
      slug: { current: 'test-post-1' },
      publishedAt: '2024-01-15T00:00:00Z',
      excerpt: 'This is a test excerpt',
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
              text: 'This is the body text for test post 1.',
            },
          ],
        },
      ],
      author: {
        _id: 'author-1',
        name: 'Test Author',
        slug: { current: 'test-author' },
      },
      categories: [
        {
          _id: 'cat-1',
          title: 'Leadership',
          slug: { current: 'leadership' },
        },
      ],
    },
    {
      _id: '2',
      title: 'Test Post 2',
      slug: { current: 'test-post-2' },
      publishedAt: '2024-01-10T00:00:00Z',
      excerpt: 'Another test excerpt',
      body: [
        {
          _type: 'block',
          _key: 'block2',
          children: [
            {
              _type: 'span',
              _key: 'span2',
              text: 'This is the body text for test post 2.',
            },
          ],
        },
      ],
      categories: [
        {
          _id: 'cat-1',
          title: 'Leadership',
          slug: { current: 'leadership' },
        },
      ],
    },
    {
      _id: '3',
      title: 'Test Post 3',
      slug: { current: 'test-post-3' },
      publishedAt: '2024-01-05T00:00:00Z',
      categories: [
        {
          _id: 'cat-2',
          title: 'Resilience',
          slug: { current: 'resilience' },
        },
      ],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders page title and description', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPosts)

    const component = await Home()
    render(component)

    expect(
      screen.getByText('Resilient Insights for Thoughtful Leaders')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Practical reflections on leadership, resilience, and growth—for navigating complexity with clarity and confidence.'
      )
    ).toBeInTheDocument()
  })

  it('displays posts grouped by category when posts exist', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPosts)

    const component = await Home()
    render(component)

    // Check category headers (rendered with uppercase class but text is not forced uppercase)
    expect(screen.getByText('Leadership')).toBeInTheDocument()
    expect(screen.getByText('Resilience')).toBeInTheDocument()

    // Check post titles
    expect(screen.getByText('Test Post 1')).toBeInTheDocument()
    expect(screen.getByText('Test Post 2')).toBeInTheDocument()
    expect(screen.getByText('Test Post 3')).toBeInTheDocument()
  })

  it('shows "No blog posts yet" message when no posts', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue([])

    const component = await Home()
    render(component)

    expect(screen.getByText('No blog posts yet.')).toBeInTheDocument()
    expect(
      screen.getByText('Create your first post in Sanity Studio →')
    ).toBeInTheDocument()
  })

  it('renders post links with correct hrefs', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPosts)

    const component = await Home()
    render(component)

    const link1 = screen.getByRole('link', { name: /test post 1/i })
    expect(link1).toHaveAttribute('href', '/test-post-1')

    const link2 = screen.getByRole('link', { name: /test post 2/i })
    expect(link2).toHaveAttribute('href', '/test-post-2')
  })

  it('displays post metadata (title, preview text, date, image)', async () => {
    ;(mockClient.fetch as jest.Mock).mockResolvedValue(mockPosts)

    const component = await Home()
    render(component)

    // Check post titles
    expect(screen.getByText('Test Post 1')).toBeInTheDocument()
    expect(screen.getByText('Test Post 2')).toBeInTheDocument()

    // Check preview text (body text is used when excerpt exists but body is preferred for preview)
    expect(
      screen.getByText(/this is the body text for test post 1/i)
    ).toBeInTheDocument()

    // Check dates (timezone may affect the exact date, multiple dates exist)
    const dates = screen.getAllByText(/january/i)
    expect(dates.length).toBeGreaterThan(0)

    // Check images
    const images = screen.getAllByAltText('Test Post 1')
    expect(images.length).toBeGreaterThan(0)
  })

  it('verifies metadata export structure', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('Articles | Resilient Leadership')
    expect(metadata.description).toContain('Leadership insights')
    expect(metadata.openGraph).toBeDefined()
    expect(metadata.openGraph?.title).toBe('Articles | Resilient Leadership')
    expect(metadata.twitter).toBeDefined()
    expect((metadata.twitter as { card?: string })?.card).toBe(
      'summary_large_image'
    )
  })

  it('handles posts without optional fields', async () => {
    const minimalPost: Post = {
      _id: '4',
      title: 'Minimal Post',
      slug: { current: 'minimal-post' },
      publishedAt: '2024-01-01T00:00:00Z',
    }

    ;(mockClient.fetch as jest.Mock).mockResolvedValue([minimalPost])

    const component = await Home()
    render(component)

    expect(screen.getByText('Minimal Post')).toBeInTheDocument()
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })
})
