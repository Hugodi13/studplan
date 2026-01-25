import React from 'react'
import { cn } from '@/lib/utils'

export const Checkbox = ({ className, checked, ...props }) => (
  <input
    type="checkbox"
    checked={checked}
    className={cn('h-4 w-4 rounded border-slate-300 text-violet-600', className)}
    {...props}
  />
)
