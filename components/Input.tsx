import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground-dark mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-input-bg text-foreground-dark',
            'border border-transparent',
            'placeholder:text-placeholder',
            'focus:outline-none focus:ring-2 focus:ring-input-focus-ring/20 focus:border-input-focus-ring',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-300',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
