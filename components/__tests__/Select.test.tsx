import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from '../Select'

describe('Select', () => {
  it('renders select element', () => {
    render(<Select />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Select label="SUBJECT" />)
    expect(screen.getByText('SUBJECT')).toBeInTheDocument()
    expect(screen.getByLabelText('SUBJECT')).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    render(<Select placeholder="Type of project" />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveTextContent('Type of project')
  })

  it('renders options from options prop', () => {
    const options = [
      { value: 'web', label: 'Web Development' },
      { value: 'design', label: 'Design' },
      { value: 'consulting', label: 'Consulting' },
    ]
    render(<Select options={options} />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveTextContent('Web Development')
    expect(select).toHaveTextContent('Design')
    expect(select).toHaveTextContent('Consulting')
  })

  it('renders children options', () => {
    render(
      <Select>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    )
    const select = screen.getByRole('combobox')
    expect(select).toHaveTextContent('Option 1')
    expect(select).toHaveTextContent('Option 2')
  })

  it('calls onChange when selection changes', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    const options = [
      { value: 'web', label: 'Web Development' },
      { value: 'design', label: 'Design' },
    ]
    render(<Select onChange={handleChange} options={options} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'design')

    expect(handleChange).toHaveBeenCalled()
    expect(select).toHaveValue('design')
  })

  it('displays error message when error prop is provided', () => {
    render(<Select error="Please select an option" />)
    expect(screen.getByText('Please select an option')).toBeInTheDocument()
    expect(screen.getByText('Please select an option')).toHaveAttribute('role', 'alert')
  })

  it('applies error styles when error is present', () => {
    const { container } = render(<Select error="Error message" />)
    const select = container.querySelector('select')
    expect(select).toHaveClass('border-red-300')
  })

  it('handles disabled state', () => {
    render(<Select disabled />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('renders chevron icon', () => {
    const { container } = render(<Select />)
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Select className="custom-class" />)
    const select = container.querySelector('select')
    expect(select).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSelectElement>()
    render(<Select ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  it('applies base styles', () => {
    const { container } = render(<Select />)
    const select = container.querySelector('select')
    expect(select).toHaveClass('w-full', 'px-4', 'py-3', 'rounded-lg', 'appearance-none')
  })

  it('has proper focus styles', () => {
    const { container } = render(<Select />)
    const select = container.querySelector('select')
    expect(select).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('accepts all standard select attributes', () => {
    render(<Select name="subject" required aria-label="Select subject" />)
    const select = screen.getByLabelText('Select subject')
    expect(select).toHaveAttribute('name', 'subject')
    expect(select).toBeRequired()
  })

  it('generates unique id when not provided', () => {
    const { container } = render(<Select label="Test" />)
    const select = container.querySelector('select')
    const label = container.querySelector('label')
    expect(select?.id).toBeTruthy()
    expect(label?.getAttribute('for')).toBe(select?.id)
  })
})
