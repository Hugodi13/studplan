import React, { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

const DialogContext = createContext(null)

export const Dialog = ({ open, onOpenChange, children }) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>
    {open ? children : null}
  </DialogContext.Provider>
)

export const DialogContent = ({ className, children, ...props }) => {
  const context = useContext(DialogContext)
  if (!context?.open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => context?.onOpenChange?.(false)}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn('space-y-1', className)} {...props} />
)

export const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
)

export const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-slate-500', className)} {...props} />
)

export const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex justify-end gap-3 pt-4', className)} {...props} />
)
