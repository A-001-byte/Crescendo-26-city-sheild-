const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div className={`${sizes[size] || sizes.md} rounded-full border-border-default border-t-accent-blue animate-spin ${className}`} />
  )
}
