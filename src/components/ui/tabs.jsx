import React, { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

const TabsContext = createContext(null)

export const Tabs = ({ value, onValueChange, className, children }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={cn('space-y-2', className)}>{children}</div>
  </TabsContext.Provider>
)

export const TabsList = ({ className, ...props }) => (
  <div className={cn('inline-flex rounded-lg bg-slate-100 p-1', className)} {...props} />
)

export const TabsTrigger = ({ value, className, children, ...props }) => {
  const context = useContext(TabsContext)
  const isActive = context?.value === value
  return (
    <button
      type="button"
      onClick={() => context?.onValueChange?.(value)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, className, ...props }) => {
  const context = useContext(TabsContext)
  if (context?.value !== value) return null
  return <div className={cn('pt-2', className)} {...props} />
}
