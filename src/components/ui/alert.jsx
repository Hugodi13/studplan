import React from 'react'
import { cn } from '@/lib/utils'

export const Alert = ({ className, variant, ...props }) => {
  const variants = {
    destructive: 'border-red-200 bg-red-50 text-red-700',
    default: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-sm',
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  )
}

export const AlertDescription = ({ className, ...props }) => (
  <div className={cn('text-sm text-current', className)} {...props} />
)
