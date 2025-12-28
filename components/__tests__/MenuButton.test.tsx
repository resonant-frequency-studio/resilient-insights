import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuButton from '../MenuButton'

describe('MenuButton', () => {
  it('renders menu icon when closed', () => {
    render(<MenuButton isOpen={false} />)
    const button = screen.getByRole('button')
    const menuIcon = button.querySelector('svg')
    expect(menuIcon).toBeInTheDocument()
    // Check that it's the menu icon by checking the path data contains horizontal lines
    const path = menuIcon?.querySelector('path')
    expect(path?.getAttribute('d')).toContain('M4 6H20')
  })

  it('renders close icon when open', () => {
    render(<MenuButton isOpen={true} />)
    const button = screen.getByRole('button')
    const closeIcon = button.querySelector('svg')
    expect(closeIcon).toBeInTheDocument()
    // Check that it's the close icon by checking the path data contains diagonal lines
    const path = closeIcon?.querySelector('path')
    expect(path?.getAttribute('d')).toContain('M18 6L6 18')
  })

  it('has default aria-label when closed', () => {
    render(<MenuButton isOpen={false} />)
    const button = screen.getByRole('button', { name: /open menu/i })
    expect(button).toBeInTheDocument()
  })

  it('has default aria-label when open', () => {
    render(<MenuButton isOpen={true} />)
    const button = screen.getByRole('button', { name: /close menu/i })
    expect(button).toBeInTheDocument()
  })

  it('accepts custom aria-label', () => {
    render(<MenuButton isOpen={false} aria-label="Toggle navigation" />)
    const button = screen.getByRole('button', { name: /toggle navigation/i })
    expect(button).toBeInTheDocument()
  })

  it('has aria-expanded attribute', () => {
    const { rerender } = render(<MenuButton isOpen={false} />)
    let button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')

    rerender(<MenuButton isOpen={true} />)
    button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('calls onToggle when clicked', async () => {
    const handleToggle = jest.fn()
    const user = userEvent.setup()
    render(<MenuButton isOpen={false} onToggle={handleToggle} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(handleToggle).toHaveBeenCalledTimes(1)
  })

  it('handles disabled state', () => {
    render(<MenuButton isOpen={false} disabled />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('does not call onToggle when disabled', async () => {
    const handleToggle = jest.fn()
    const user = userEvent.setup()
    render(<MenuButton isOpen={false} onToggle={handleToggle} disabled />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(handleToggle).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <MenuButton isOpen={false} className="custom-class" />
    )
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<MenuButton isOpen={false} ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('applies base styles', () => {
    const { container } = render(<MenuButton isOpen={false} />)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'w-10',
      'h-10',
      'rounded-full'
    )
  })

  it('uses semantic color classes', () => {
    const { container } = render(<MenuButton isOpen={false} />)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-secondary', 'border-checkbox-border', 'text-foreground-dark')
  })

  it('has proper focus styles', () => {
    const { container } = render(<MenuButton isOpen={false} />)
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
  })

  it('toggles between states when isOpen changes', () => {
    const { rerender } = render(<MenuButton isOpen={false} />)
    let button = screen.getByRole('button')
    let path = button.querySelector('svg path')
    expect(path?.getAttribute('d')).toContain('M4 6H20') // Menu icon

    rerender(<MenuButton isOpen={true} />)
    button = screen.getByRole('button')
    path = button.querySelector('svg path')
    expect(path?.getAttribute('d')).toContain('M18 6L6 18') // Close icon
  })

  it('accepts all standard button HTML attributes', () => {
    render(
      <MenuButton
        isOpen={false}
        type="button"
        data-testid="menu-button"
      />
    )
    const button = screen.getByTestId('menu-button')
    expect(button).toHaveAttribute('type', 'button')
  })
})

