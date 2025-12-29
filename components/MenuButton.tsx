import React from 'react'
import { cn } from '@/lib/utils'
import { Menu } from './icons/Menu'
import { Close } from './icons/Close'

export interface MenuButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  isOpen?: boolean
  onToggle?: () => void
  'aria-label'?: string
}

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ isOpen = false, onToggle, className, 'aria-label': ariaLabel, ...props }, ref) => {
    const defaultAriaLabel = isOpen ? 'Close menu' : 'Open menu'

    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-label={ariaLabel || defaultAriaLabel}
        aria-expanded={isOpen}
        className={cn(
          'flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'bg-secondary border border-checkbox-border',
          'text-foreground-dark',
          'hover:bg-third transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-input-focus-ring/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isOpen ? <Close className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    )
  }
)

MenuButton.displayName = 'MenuButton'

export default MenuButton
