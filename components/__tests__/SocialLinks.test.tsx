import { render, screen } from '@testing-library/react'
import SocialLinks from '../SocialLinks'

describe('SocialLinks', () => {
  it('returns null when no URLs are provided', () => {
    const { container } = render(<SocialLinks />)
    expect(container.firstChild).toBeNull()
  })

  it('renders only links with URLs provided', () => {
    render(<SocialLinks linkedin="https://linkedin.com/test" youtube="https://youtube.com/test" />)
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
  })

  it('renders all social links when all URLs provided', () => {
    render(
      <SocialLinks
        linkedin="https://linkedin.com/test"
        facebook="https://facebook.com/test"
        instagram="https://instagram.com/test"
        youtube="https://youtube.com/test"
      />
    )
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
  })

  it('links have correct href attributes', () => {
    render(
      <SocialLinks
        linkedin="https://linkedin.com/test"
        youtube="https://youtube.com/test"
      />
    )
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com/test')
    expect(screen.getByLabelText('YouTube')).toHaveAttribute('href', 'https://youtube.com/test')
  })

  it('links open in new tab with security attributes', () => {
    render(<SocialLinks linkedin="https://linkedin.com/test" />)
    const link = screen.getByLabelText('LinkedIn')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies custom className to container', () => {
    const { container } = render(
      <SocialLinks linkedin="https://linkedin.com/test" className="custom-container" />
    )
    expect(container.firstChild).toHaveClass('custom-container')
  })

  it('applies custom iconClassName to links', () => {
    render(
      <SocialLinks
        linkedin="https://linkedin.com/test"
        iconClassName="custom-icon-class"
      />
    )
    const link = screen.getByLabelText('LinkedIn')
    expect(link).toHaveClass('custom-icon-class')
  })

  it('renders icons correctly', () => {
    const { container } = render(<SocialLinks linkedin="https://linkedin.com/test" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has proper accessibility labels', () => {
    render(
      <SocialLinks
        linkedin="https://linkedin.com/test"
        facebook="https://facebook.com/test"
        instagram="https://instagram.com/test"
        youtube="https://youtube.com/test"
      />
    )
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
  })

  it('applies base styles to links', () => {
    render(<SocialLinks linkedin="https://linkedin.com/test" />)
    const link = screen.getByLabelText('LinkedIn')
    expect(link).toHaveClass('w-10', 'h-10', 'rounded-full', 'border')
  })
})

