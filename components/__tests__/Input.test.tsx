import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from '../Input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Input label="NAME" />)
    expect(screen.getByText('NAME')).toBeInTheDocument()
    expect(screen.getByLabelText('NAME')).toBeInTheDocument()
  })

  it('associates label with input via htmlFor', () => {
    render(<Input label="EMAIL" id="email-input" />)
    const label = screen.getByText('EMAIL')
    const input = screen.getByLabelText('EMAIL')
    expect(label).toHaveAttribute('for', 'email-input')
    expect(input).toHaveAttribute('id', 'email-input')
  })

  it('renders placeholder text', () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
  })

  it('displays value when provided', () => {
    render(<Input value="John Mercedes" onChange={() => {}} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('John Mercedes')
  })

  it('calls onChange when user types', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message when error prop is provided', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByText('This field is required')).toHaveAttribute('role', 'alert')
  })

  it('applies error styles when error is present', () => {
    const { container } = render(<Input error="Error message" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('border-red-300')
  })

  it('handles disabled state', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('applies custom className', () => {
    const { container } = render(<Input className="custom-class" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('applies base styles', () => {
    const { container } = render(<Input />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('w-full', 'px-4', 'py-3', 'rounded-lg')
  })

  it('has proper focus styles', () => {
    const { container } = render(<Input />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('accepts all standard input attributes', () => {
    render(
      <Input
        type="email"
        name="email"
        required
        aria-label="Email address"
      />
    )
    const input = screen.getByLabelText('Email address')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toBeRequired()
  })

  it('generates unique id when not provided', () => {
    const { container } = render(<Input label="Test" />)
    const input = container.querySelector('input')
    const label = container.querySelector('label')
    expect(input?.id).toBeTruthy()
    expect(label?.getAttribute('for')).toBe(input?.id)
  })
})

