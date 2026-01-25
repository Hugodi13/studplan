import React from 'react'
import { cn } from '@/lib/utils'

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'md', ...props },
  ref,
) {
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
    destructive: 'bg-red-600 text-white hover:bg-red-500',
  }
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  }

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.md,
        className,
      )}
      {...props}
    />
  )
})
