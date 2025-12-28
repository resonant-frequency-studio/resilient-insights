import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'href'> {
  variant?: 'primary' | 'inverse' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
  href?: string
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'right',
      className,
      children,
      href,
      asChild,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary:
        'bg-button-primary border border-button-primary text-foreground-light hover:bg-button-inverse-hover hover:text-button-primary hover:border-button-primary focus:ring-button-primary',
      inverse:
        'bg-button-inverse border border-button-inverse text-button-primary hover:bg-button-primary-hover hover:text-button-inverse hover:border-button-inverse focus:ring-button-primary',
      outline:
        'bg-transparent border border-button-outline text-foreground-dark hover:bg-button-primary-hover hover:border-foreground-dark hover:text-foreground-light focus:ring-foreground-dark',
      glass:
        'bg-button-glass/80 backdrop-blur-sm border border-white/10 text-foreground-light hover:bg-button-glass/90 focus:ring-button-primary',
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    const buttonClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    )

    const content = (
      <>
        {icon && iconPosition === 'left' && (
          <span className="shrink-0 mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="shrink-0 ml-2">{icon}</span>
        )}
      </>
    )

    if (href) {
      return (
        <Link href={href} className={buttonClasses}>
          {content}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={buttonClasses}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

