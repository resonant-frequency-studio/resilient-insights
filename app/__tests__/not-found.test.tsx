import { render, screen } from '@testing-library/react'
import NotFound, { metadata } from '../not-found'

// Mock Next.js modules
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

describe('NotFound Page', () => {
  it('renders 404 message and description', () => {
    render(<NotFound />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    expect(
      screen.getByText(
        "We couldn't find the page you're looking for. It may have been moved, deleted, or the URL might be incorrect."
      )
    ).toBeInTheDocument()
  })

  it('displays "Go to Homepage" and "Contact Us" buttons', () => {
    render(<NotFound />)

    const homepageButton = screen.getByRole('link', { name: /go to homepage/i })
    expect(homepageButton).toBeInTheDocument()
    expect(homepageButton).toHaveAttribute('href', '/')

    const contactButton = screen.getByRole('link', { name: /contact us/i })
    expect(contactButton).toBeInTheDocument()
    expect(contactButton).toHaveAttribute('href', '/contact')
  })

  it('renders all popular page links', () => {
    render(<NotFound />)

    // Check section heading
    expect(screen.getByText('Popular Pages')).toBeInTheDocument()

    // Check all popular links
    const whatWeDoLink = screen.getByRole('link', { name: /what we do/i })
    expect(whatWeDoLink).toBeInTheDocument()
    expect(whatWeDoLink).toHaveAttribute('href', '/services')

    const executiveCoachingLink = screen.getByRole('link', {
      name: /executive coaching/i,
    })
    expect(executiveCoachingLink).toBeInTheDocument()
    expect(executiveCoachingLink).toHaveAttribute(
      'href',
      '/services/executive-coaching'
    )

    const teamCoachingLink = screen.getByRole('link', {
      name: /team coaching/i,
    })
    expect(teamCoachingLink).toBeInTheDocument()
    expect(teamCoachingLink).toHaveAttribute('href', '/services/team-coaching')

    const aboutLink = screen.getByRole('link', { name: /about us/i })
    expect(aboutLink).toBeInTheDocument()
    expect(aboutLink).toHaveAttribute('href', '/about')

    const contactLink = screen.getByRole('link', { name: /^contact$/i })
    expect(contactLink).toBeInTheDocument()
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('verifies metadata export structure', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('Page Not Found | Resilient Leadership')
    expect(metadata.description).toContain(
      'The page you are looking for could not be found'
    )
  })
})
