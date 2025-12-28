import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Textarea from '../Textarea'

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Textarea label="MESSAGE" />)
    expect(screen.getByText('MESSAGE')).toBeInTheDocument()
    expect(screen.getByLabelText('MESSAGE')).toBeInTheDocument()
  })

  it('associates label with textarea via htmlFor', () => {
    render(<Textarea label="MESSAGE" id="message-textarea" />)
    const label = screen.getByText('MESSAGE')
    const textarea = screen.getByLabelText('MESSAGE')
    expect(label).toHaveAttribute('for', 'message-textarea')
    expect(textarea).toHaveAttribute('id', 'message-textarea')
  })

  it('renders placeholder text', () => {
    render(<Textarea placeholder="Tell us about your project" />)
    expect(
      screen.getByPlaceholderText('Tell us about your project')
    ).toBeInTheDocument()
  })

  it('displays value when provided', () => {
    render(<Textarea value="Test message" onChange={() => {}} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('Test message')
  })

  it('calls onChange when user types', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Textarea onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'test message')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('displays error message when error prop is provided', () => {
    render(<Textarea error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByText('This field is required')).toHaveAttribute('role', 'alert')
  })

  it('applies error styles when error is present', () => {
    const { container } = render(<Textarea error="Error message" />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('border-red-300')
  })

  it('handles disabled state', () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('is resizable vertically', () => {
    const { container } = render(<Textarea />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('resize-y')
  })

  it('has minimum height', () => {
    const { container } = render(<Textarea />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('min-h-[120px]')
  })

  it('applies custom className', () => {
    const { container } = render(<Textarea className="custom-class" />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('applies base styles', () => {
    const { container } = render(<Textarea />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('w-full', 'px-4', 'py-3', 'rounded-lg')
  })

  it('has proper focus styles', () => {
    const { container } = render(<Textarea />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('accepts all standard textarea attributes', () => {
    render(
      <Textarea
        name="message"
        rows={5}
        required
        aria-label="Message textarea"
      />
    )
    const textarea = screen.getByLabelText('Message textarea')
    expect(textarea).toHaveAttribute('name', 'message')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toBeRequired()
  })

  it('generates unique id when not provided', () => {
    const { container } = render(<Textarea label="Test" />)
    const textarea = container.querySelector('textarea')
    const label = container.querySelector('label')
    expect(textarea?.id).toBeTruthy()
    expect(label?.getAttribute('for')).toBe(textarea?.id)
  })
})

