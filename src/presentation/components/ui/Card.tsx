import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg bg-white shadow-sm border border-gris-border p-4
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
