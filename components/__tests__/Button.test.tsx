import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'
import { ArrowRight } from '../icons/ArrowRight'

describe('Button', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with default primary variant', () => {
    const { container } = render(<Button>Primary Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-button-primary')
  })

  it('renders primary variant correctly', () => {
    const { container } = render(<Button variant="primary">Primary Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-button-primary', 'text-foreground-light')
  })

  it('renders inverse variant correctly', () => {
    const { container } = render(<Button variant="inverse">Inverse Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-button-inverse', 'text-button-primary')
  })

  it('renders outline variant correctly', () => {
    const { container } = render(<Button variant="outline">Outline Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-transparent', 'border', 'border-button-outline')
  })

  it('renders glass variant correctly', () => {
    const { container } = render(<Button variant="glass">Glass Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-button-glass/80', 'backdrop-blur-sm')
  })

  it('renders small size correctly', () => {
    const { container } = render(<Button size="sm">Small Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
  })

  it('renders medium size correctly (default)', () => {
    const { container } = render(<Button>Medium Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('px-6', 'py-3', 'text-base')
  })

  it('renders large size correctly', () => {
    const { container } = render(<Button size="lg">Large Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('px-8', 'py-4', 'text-lg')
  })

  it('renders with icon on the right by default', () => {
    render(
      <Button icon={<ArrowRight />} data-testid="button-with-icon">
        Get Template
      </Button>
    )
    const button = screen.getByTestId('button-with-icon')
    expect(button).toBeInTheDocument()
    expect(screen.getByText('Get Template')).toBeInTheDocument()
    // Icon should be present (checking for SVG)
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders with icon on the left when specified', () => {
    const { container } = render(
      <Button icon={<ArrowRight />} iconPosition="left">
        Get Template
      </Button>
    )
    const button = container.firstChild as HTMLElement
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Icon should be before text
    expect(button.firstChild).toBe(svg?.parentElement)
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('handles disabled state correctly', () => {
    const { container } = render(<Button disabled>Disabled Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    )

    const button = screen.getByRole('button', { name: /disabled button/i })
    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Button</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('applies all base styles', () => {
    const { container } = render(<Button>Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'font-semibold',
      'transition-all'
    )
  })

  it('has proper focus ring styles', () => {
    const { container } = render(<Button variant="primary">Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('renders with all button HTML attributes', () => {
    render(
      <Button type="submit" aria-label="Submit form">
        Submit
      </Button>
    )
    const button = screen.getByRole('button', { name: /submit form/i })
    expect(button).toHaveAttribute('type', 'submit')
  })
})
