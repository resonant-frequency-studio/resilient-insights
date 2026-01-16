import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: React.ReactNode
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, checked, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id || generatedId
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [isChecked, setIsChecked] = React.useState(checked || false)

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    // Sync with controlled prop
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(e.target.checked)
      if (props.onChange) {
        props.onChange(e)
      }
    }

    const handleVisualClick = () => {
      if (inputRef.current && !props.disabled) {
        inputRef.current.click()
      }
    }

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={inputRef}
              type="checkbox"
              id={checkboxId}
              className={cn('sr-only', error && 'border-red-300', className)}
              checked={isChecked}
              onChange={handleChange}
              {...props}
            />
            <div
              className={cn(
                'w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer',
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-input-focus-ring/20',
                props.disabled && 'opacity-50 cursor-not-allowed',
                error && 'border-red-300'
              )}
              style={{
                backgroundColor: isChecked
                  ? 'var(--color-checkbox-checked)'
                  : 'var(--color-checkbox-bg)',
                borderColor: isChecked
                  ? 'var(--color-checkbox-checked)'
                  : 'var(--color-checkbox-border)',
              }}
              onClick={handleVisualClick}
              aria-hidden="true"
            >
              <svg
                className={cn(
                  'w-4 h-4 transition-all duration-200',
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                )}
                fill="none"
                stroke="var(--color-checkbox-checkmark)"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm text-foreground-dark cursor-pointer',
                props.disabled && 'cursor-not-allowed opacity-50',
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
