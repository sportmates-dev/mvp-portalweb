import { forwardRef, type InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
          {label}
        </label>
        <input
          ref={ref}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 dark:text-dark-text bg-white dark:bg-dark-surface
            placeholder:text-gray-400 dark:placeholder:text-dark-text-muted transition-colors min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
            ${error ? 'border-rojo-alert' : 'border-gris-border dark:border-dark-border'}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-rojo-alert">{error}</p>
        )}
      </div>
    )
  },
)

TextInput.displayName = 'TextInput'
