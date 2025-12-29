import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

describe('Footer', () => {
  it('renders company name', () => {
    render(<Footer />)
    expect(screen.getByText('Resilient Leadership')).toBeInTheDocument()
  })

  it('renders company description', () => {
    render(<Footer />)
    expect(
      screen.getByText(/Resilient Leadership helps leaders and teams grow through change/i)
    ).toBeInTheDocument()
  })

  it('renders Services section with all service links', () => {
    render(<Footer />)
    expect(screen.getByText('What we do')).toBeInTheDocument()
    expect(screen.getByText('Executive Coaching')).toBeInTheDocument()
    expect(screen.getByText('Team Coaching')).toBeInTheDocument()
    expect(screen.getByText('Change Management')).toBeInTheDocument()
    expect(screen.getByText('360˚ Feedback')).toBeInTheDocument()
    expect(screen.getByText('Surveys and Assessments')).toBeInTheDocument()
  })

  it('renders Navigation section with all nav links', () => {
    render(<Footer />)
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Articles')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders Legal section with privacy link', () => {
    render(<Footer />)
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('service links have correct href attributes', () => {
    render(<Footer />)
    const executiveCoaching = screen.getByText('Executive Coaching').closest('a')
    expect(executiveCoaching).toHaveAttribute('href', 'https://resilientleadership.us/executive-coaching')
  })

  it('navigation links have correct href attributes', () => {
    render(<Footer />)
    const homeLink = screen.getByText('Home').closest('a')
    const articlesLink = screen.getByText('Articles').closest('a')
    expect(homeLink).toHaveAttribute('href', 'https://resilientleadership.us')
    // Articles uses Next.js Link, check it exists
    expect(articlesLink).toBeInTheDocument()
  })

  it('renders SocialLinks component', () => {
    render(<Footer />)
    // SocialLinks should render with placeholder URLs
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument()
  })

  it('has proper footer structure', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-fifth', 'text-foreground-light')
  })

  it('renders all sections in grid layout', () => {
    const { container } = render(<Footer />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('has divider between main content and bottom section', () => {
    const { container } = render(<Footer />)
    const divider = container.querySelector('.border-t')
    expect(divider).toBeInTheDocument()
  })
})

