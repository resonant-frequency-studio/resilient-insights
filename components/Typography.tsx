import React from 'react'
import { cn } from '@/lib/utils'

type TypographyElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'li'
  | 'blockquote'

type TypographyVariant =
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'heading-4'
  | 'heading-5'
  | 'heading-6'
  | 'body'
  | 'body-large'
  | 'body-small'
  | 'body-muted'
  | 'body-light'
  | 'body-semibold'
  | 'caption'
  | 'nav'
  | 'button'
  | 'quote'

export interface TypographyProps {
  as?: TypographyElement
  variant?: TypographyVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<TypographyVariant, string> = {
  'heading-1':
    '[font-family:var(--font-heading)] font-medium text-4xl md:text-heading-1 leading-tight tracking-tight text-foreground-dark',
  'heading-2':
    '[font-family:var(--font-heading)] font-medium text-3xl md:text-heading-2 leading-tight tracking-tight text-foreground-dark',
  'heading-3':
    '[font-family:var(--font-heading)] font-normal text-2xl md:text-heading-3 leading-tight tracking-tight text-foreground-dark',
  'heading-4':
    '[font-family:var(--font-heading)] font-normal text-xl md:text-heading-4 leading-tight tracking-tight text-foreground-dark',
  'heading-5':
    '[font-family:var(--font-heading)] font-normal text-lg md:text-heading-5 leading-tight tracking-tight text-foreground-dark',
  'heading-6':
    '[font-family:var(--font-heading)] font-normal text-base md:text-heading-6 leading-tight tracking-tight text-foreground-dark',
  body: '[font-family:var(--font-body)] text-base leading-body text-foreground-dark',
  'body-large':
    '[font-family:var(--font-body)] text-lg md:text-xl leading-body text-foreground-dark',
  'body-small': '[font-family:var(--font-body)] text-sm leading-body text-foreground-dark',
  'body-muted': '[font-family:var(--font-body)] text-base leading-body text-foreground-dark/70',
  'body-light':
    '[font-family:var(--font-body)] text-base md:text-lg leading-body text-foreground-light',
  'body-semibold':
    '[font-family:var(--font-body)] text-base leading-body text-foreground-dark font-semibold',
  caption: '[font-family:var(--font-body)] text-xs leading-normal text-foreground-dark',
  nav: '[font-family:var(--font-body)] font-medium tracking-nav text-foreground-dark',
  button: '[font-family:var(--font-body)] font-semibold tracking-nav text-foreground-dark',
  quote: '[font-family:var(--font-heading)] italic text-xl leading-body text-foreground-dark',
}

const defaultElements: Record<TypographyVariant, TypographyElement> = {
  'heading-1': 'h1',
  'heading-2': 'h2',
  'heading-3': 'h3',
  'heading-4': 'h4',
  'heading-5': 'h5',
  'heading-6': 'h6',
  body: 'p',
  'body-large': 'p',
  'body-small': 'p',
  'body-muted': 'p',
  'body-light': 'p',
  'body-semibold': 'p',
  caption: 'span',
  nav: 'span',
  button: 'span',
  quote: 'blockquote',
}

const Typography = React.forwardRef<
  HTMLElement,
  TypographyProps & React.HTMLAttributes<HTMLElement>
>(({ as, variant = 'body', children, className, ...props }, ref) => {
  const Element = (as || defaultElements[variant]) as string
  const baseStyles = variantStyles[variant]

  return React.createElement(
    Element as React.ElementType,
    {
      ref,
      className: cn(baseStyles, className),
      ...props,
    },
    children
  )
})

Typography.displayName = 'Typography'

export default Typography
