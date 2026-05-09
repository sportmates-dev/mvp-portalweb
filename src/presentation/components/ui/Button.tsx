import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-verde-primary hover:bg-verde-bright text-white',
  secondary: 'bg-azul-primary hover:bg-blue-700 text-white',
  danger: 'bg-rojo-alert hover:bg-red-600 text-white',
  ghost: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  loading?: boolean
}

export function Button({
  variant = 'primary',
  children,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5
        text-sm font-semibold transition-colors duration-150 min-h-[44px]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
