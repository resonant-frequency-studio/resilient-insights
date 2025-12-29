import React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={cn(
                'peer sr-only',
                error && 'border-red-300',
                className
              )}
              {...props}
            />
            <div
              className={cn(
                'w-5 h-5 rounded border-2 transition-all duration-200',
                'border-checkbox-border bg-checkbox-bg',
                'peer-checked:bg-checkbox-checked peer-checked:border-checkbox-checked',
                'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-input-focus-ring/20',
                'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                error && 'border-red-300'
              )}
              aria-hidden="true"
            >
              <svg
                className={cn(
                  'w-3.5 h-3.5 text-checkbox-checkmark transition-opacity duration-200',
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  'opacity-0 peer-checked:opacity-100'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm text-foreground-dark cursor-pointer',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                error && 'text-red-600'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1.5 ml-8 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox

