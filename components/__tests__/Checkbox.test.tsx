import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checkbox from '../Checkbox'

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe('Checkbox', () => {
  it('renders checkbox input element', () => {
    render(<Checkbox />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Checkbox label="I agree to the terms" />)
    expect(screen.getByText('I agree to the terms')).toBeInTheDocument()
    expect(screen.getByLabelText('I agree to the terms')).toBeInTheDocument()
  })

  it('associates label with checkbox via htmlFor', () => {
    render(<Checkbox label="Agree" id="agree-checkbox" />)
    const label = screen.getByText('Agree')
    const checkbox = screen.getByLabelText('Agree')
    expect(label).toHaveAttribute('for', 'agree-checkbox')
    expect(checkbox).toHaveAttribute('id', 'agree-checkbox')
  })

  it('renders label with React node content', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Link = require('next/link').default
    render(
      <Checkbox
        label={
          <>
            By sending this form, I agree to the{' '}
            <Link href="/terms/terms-of-service">Terms of Service</Link>.
          </>
        }
      />
    )
    // Check that the label contains the text and link
    const label = screen.getByText(/By sending this form, I agree to the/)
    expect(label).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', '/terms/terms-of-service')
  })

  it('is unchecked by default', () => {
    render(<Checkbox />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('is checked when checked prop is true', () => {
    render(<Checkbox checked />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('toggles when clicked', async () => {
    const user = userEvent.setup()
    render(<Checkbox />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('calls onChange when clicked', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Checkbox onChange={handleChange} />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('displays error message when error prop is provided', () => {
    render(<Checkbox error="You must agree to continue" />)
    expect(screen.getByText('You must agree to continue')).toBeInTheDocument()
    expect(screen.getByText('You must agree to continue')).toHaveAttribute(
      'role',
      'alert'
    )
  })

  it('applies error styles when error is present', () => {
    const { container } = render(<Checkbox error="Error message" />)
    const visualBox = container.querySelector('div[aria-hidden="true"]')
    expect(visualBox).toHaveClass('border-red-300')
  })

  it('handles disabled state', () => {
    render(<Checkbox disabled />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('does not call onChange when disabled', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Checkbox onChange={handleChange} disabled />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(handleChange).not.toHaveBeenCalled()
  })

  it('renders checkmark icon when checked', () => {
    const { container } = render(<Checkbox checked />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Check that the SVG has the classes for showing when checked
    expect(svg).toHaveClass('opacity-100', 'scale-100')
  })

  it('hides checkmark icon when unchecked', () => {
    const { container } = render(<Checkbox />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Check that the SVG has the opacity-0 and scale-75 classes when unchecked
    expect(svg).toHaveClass('opacity-0', 'scale-75')
  })

  it('applies custom className', () => {
    const { container } = render(<Checkbox className="custom-class" />)
    const checkbox = container.querySelector('input[type="checkbox"]')
    expect(checkbox).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('applies base styles to visual checkbox', () => {
    const { container } = render(<Checkbox />)
    const visualBox = container.querySelector('div[aria-hidden="true"]')
    expect(visualBox).toHaveClass('w-5', 'h-5', 'rounded', 'border-2')
  })

  it('has proper focus styles', () => {
    const { container } = render(<Checkbox />)
    const visualBox = container.querySelector('div[aria-hidden="true"]')
    // The visual box should have focus-within styles
    expect(visualBox).toHaveClass(
      'focus-within:ring-2',
      'focus-within:ring-input-focus-ring/20'
    )
  })

  it('accepts all standard checkbox attributes', () => {
    render(
      <Checkbox name="agree" value="yes" required aria-label="Agree to terms" />
    )
    const checkbox = screen.getByLabelText('Agree to terms')
    expect(checkbox).toHaveAttribute('name', 'agree')
    expect(checkbox).toHaveAttribute('value', 'yes')
    expect(checkbox).toBeRequired()
  })

  it('generates unique id when not provided', () => {
    const { container } = render(<Checkbox label="Test" />)
    const checkbox = container.querySelector('input[type="checkbox"]')
    const label = container.querySelector('label')
    expect(checkbox?.id).toBeTruthy()
    expect(label?.getAttribute('for')).toBe(checkbox?.id)
  })
})
