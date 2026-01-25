import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

const SelectContext = createContext(null)

export const Select = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = ({ className, children, ...props }) => {
  const context = useContext(SelectContext)
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm',
        className,
      )}
      onClick={() => context?.setOpen(!context?.open)}
      {...props}
    >
      {children}
    </button>
  )
}

export const SelectValue = ({ placeholder }) => {
  const context = useContext(SelectContext)
  return <span>{context?.value || placeholder}</span>
}

export const SelectContent = ({ className, children }) => {
  const context = useContext(SelectContext)
  if (!context?.open) return null
  return (
    <div
      className={cn(
        'absolute z-20 mt-2 w-full rounded-md border border-slate-200 bg-white p-1 shadow-lg',
        className,
      )}
    >
      {children}
    </div>
  )
}

export const SelectItem = ({ value, className, children, ...props }) => {
  const context = useContext(SelectContext)
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100',
        className,
      )}
      onClick={() => {
        context?.onValueChange?.(value)
        context?.setOpen(false)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
