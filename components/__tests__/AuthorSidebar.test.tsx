import React from 'react'
import { render, screen } from '@testing-library/react'
import AuthorSidebar from '../AuthorSidebar'
import { Author } from '@/types/sanity'

// Mock Next.js Image and PortableText
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, ...props }: { src: string; alt: string; fill?: boolean }) => {
    const imgProps: { style?: React.CSSProperties } = fill
      ? { style: { position: 'absolute', inset: 0 } }
      : {}
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...imgProps} {...props} />
  },
}))

jest.mock('@portabletext/react', () => ({
  PortableText: ({ value }: { value: unknown }) => (
    <div data-testid="portable-text">{JSON.stringify(value)}</div>
  ),
}))

jest.mock('@/sanity/lib/image', () => ({
  urlFor: (source: { _ref?: string }) => ({
    width: () => ({
      height: () => ({
        url: () => `https://cdn.sanity.io/images/test/${source?._ref || 'image'}.jpg`,
      }),
    }),
  }),
}))

const mockAuthor: Author = {
  _id: 'author-1',
  name: 'Charlene Wilson',
  slug: {
    current: 'charlene-wilson',
  },
  bio: [
    {
      _type: 'block',
      _key: 'block-1',
      children: [{ _type: 'span', text: 'Executive Coach and Facilitator', _key: 'span-1' }],
    },
  ],
  linkedin: 'https://linkedin.com/in/charlene',
  facebook: 'https://facebook.com/charlene',
  instagram: 'https://instagram.com/charlene',
  youtube: 'https://youtube.com/charlene',
}

describe('AuthorSidebar', () => {
  it('returns null when no author provided', () => {
    const { container } = render(<AuthorSidebar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders author heading', () => {
    render(<AuthorSidebar author={mockAuthor} />)
    expect(screen.getByText('ABOUT THE AUTHOR')).toBeInTheDocument()
  })

  it('renders author image when provided', () => {
    const authorWithImage = {
      ...mockAuthor,
      image: { _type: 'image', asset: { _ref: 'image-123' } },
    }
    render(<AuthorSidebar author={authorWithImage} />)
    const image = screen.getByAltText('Charlene Wilson')
    expect(image).toBeInTheDocument()
  })

  it('does not render image when not provided', () => {
    const authorWithoutImage = {
      ...mockAuthor,
      image: undefined,
    }
    render(<AuthorSidebar author={authorWithoutImage} />)
    const image = screen.queryByAltText('Charlene Wilson')
    expect(image).not.toBeInTheDocument()
  })

  it('renders author bio when provided', () => {
    render(<AuthorSidebar author={mockAuthor} />)
    expect(screen.getByTestId('portable-text')).toBeInTheDocument()
  })

  it('renders learn more link when author slug exists', () => {
    render(<AuthorSidebar author={mockAuthor} />)
    const link = screen.getByText(/LEARN MORE ABOUT CHARLENE/i)
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://resilientleadership.us/about')
  })

  it('shows only first name in learn more text', () => {
    const authorWithLongName = {
      ...mockAuthor,
      name: 'John Michael Smith',
    }
    render(<AuthorSidebar author={authorWithLongName} />)
    expect(screen.getByText(/LEARN MORE ABOUT JOHN/i)).toBeInTheDocument()
    expect(screen.queryByText(/MICHAEL/i)).not.toBeInTheDocument()
  })

  it('does not render learn more link when slug is missing', () => {
    const authorWithoutSlug = {
      ...mockAuthor,
      slug: undefined,
    } as unknown as Author
    render(<AuthorSidebar author={authorWithoutSlug} />)
    expect(screen.queryByText(/LEARN MORE/i)).not.toBeInTheDocument()
  })

  it('renders SocialLinks component with author social URLs', () => {
    render(<AuthorSidebar author={mockAuthor} />)
    // SocialLinks should be rendered (we can check for the links)
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
  })

  it('handles author without social links', () => {
    const authorWithoutSocial = {
      ...mockAuthor,
      linkedin: undefined,
      facebook: undefined,
      instagram: undefined,
      youtube: undefined,
    }
    render(<AuthorSidebar author={authorWithoutSocial} />)
    // SocialLinks component should handle empty URLs and return null
    expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument()
  })

  it('handles author without bio', () => {
    const authorWithoutBio = {
      ...mockAuthor,
      bio: undefined,
    }
    render(<AuthorSidebar author={authorWithoutBio} />)
    expect(screen.queryByTestId('portable-text')).not.toBeInTheDocument()
  })
})
