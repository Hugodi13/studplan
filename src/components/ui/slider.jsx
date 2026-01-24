import React from 'react'
import { cn } from '@/lib/utils'

export const Slider = ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={cn('w-full accent-violet-600', className)}
    />
  )
}
