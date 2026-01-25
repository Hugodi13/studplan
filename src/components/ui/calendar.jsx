import React from 'react'
import { cn } from '@/lib/utils'

export const Calendar = ({ selected, onSelect, className }) => {
  const value = selected ? new Date(selected).toISOString().split('T')[0] : ''
  return (
    <input
      type="date"
      value={value}
      onChange={(event) => {
        const next = event.target.value ? new Date(event.target.value) : null
        onSelect?.(next)
      }}
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm',
        className,
      )}
    />
  )
}
