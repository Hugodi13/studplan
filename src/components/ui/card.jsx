import React from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ className, ...props }) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props} />
)

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('border-b border-slate-100 px-4 py-3', className)} {...props} />
)

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-900', className)} {...props} />
)

export const CardContent = ({ className, ...props }) => (
  <div className={cn('px-4 py-3', className)} {...props} />
)
