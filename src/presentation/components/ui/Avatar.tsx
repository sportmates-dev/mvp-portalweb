interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-verde-primary text-white flex items-center justify-center
        font-semibold ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
