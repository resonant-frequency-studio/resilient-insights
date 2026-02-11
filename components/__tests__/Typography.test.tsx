import React from 'react'
import { render, screen } from '@testing-library/react'
import Typography from '../Typography'

describe('Typography', () => {
  it('renders with children text', () => {
    render(<Typography>Hello World</Typography>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders as paragraph by default for body variant', () => {
    render(<Typography variant="body">Body text</Typography>)
    const element = screen.getByText('Body text')
    expect(element.tagName).toBe('P')
  })

  it('renders as h1 for heading-1 variant by default', () => {
    render(<Typography variant="heading-1">Heading 1</Typography>)
    const element = screen.getByText('Heading 1')
    expect(element.tagName).toBe('H1')
  })

  it('renders as h2 for heading-2 variant by default', () => {
    render(<Typography variant="heading-2">Heading 2</Typography>)
    const element = screen.getByText('Heading 2')
    expect(element.tagName).toBe('H2')
  })

  it('overrides element with as prop', () => {
    render(
      <Typography variant="heading-1" as="h2">
        Heading
      </Typography>
    )
    const element = screen.getByText('Heading')
    expect(element.tagName).toBe('H2')
  })

  it('applies variant styles correctly', () => {
    const { container } = render(
      <Typography variant="heading-1">Title</Typography>
    )
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('text-4xl', 'md:text-heading-1')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Typography variant="body" className="custom-class">
        Text
      </Typography>
    )
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLElement>()
    render(<Typography ref={ref}>Text</Typography>)
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
  })

  it('renders all heading variants', () => {
    const variants = [
      'heading-1',
      'heading-2',
      'heading-3',
      'heading-4',
      'heading-5',
      'heading-6',
    ] as const
    variants.forEach(variant => {
      const { container } = render(
        <Typography variant={variant}>Heading</Typography>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  it('renders all body variants', () => {
    const variants = ['body', 'body-large', 'body-small'] as const
    variants.forEach(variant => {
      const { container } = render(
        <Typography variant={variant}>Body text</Typography>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  it('renders nav variant', () => {
    render(<Typography variant="nav">Navigation</Typography>)
    expect(screen.getByText('Navigation')).toBeInTheDocument()
  })

  it('renders button variant', () => {
    render(<Typography variant="button">Button Text</Typography>)
    expect(screen.getByText('Button Text')).toBeInTheDocument()
  })

  it('renders quote variant', () => {
    render(<Typography variant="quote">Quote text</Typography>)
    const element = screen.getByText('Quote text')
    expect(element.tagName).toBe('BLOCKQUOTE')
  })

  it('renders caption variant', () => {
    render(<Typography variant="caption">Caption</Typography>)
    const element = screen.getByText('Caption')
    expect(element.tagName).toBe('SPAN')
  })

  it('accepts all standard HTML attributes', () => {
    render(
      <Typography variant="body" id="test-id" data-testid="typography">
        Text
      </Typography>
    )
    const element = screen.getByTestId('typography')
    expect(element).toHaveAttribute('id', 'test-id')
  })

  it('uses semantic color classes', () => {
    const { container } = render(
      <Typography variant="heading-1">Title</Typography>
    )
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('text-foreground-dark')
  })
})
