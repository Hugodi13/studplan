import React, { createContext, useContext } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DialogContext = createContext(null)

export const Dialog = ({ open, onOpenChange, children }) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>
    {open ? children : null}
  </DialogContext.Provider>
)

export const DialogContent = ({ className, children, hideClose = false, ...props }) => {
  const context = useContext(DialogContext)
  if (!context?.open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:p-4 sm:items-center"
      onClick={() => context?.onOpenChange?.(false)}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 shadow-xl max-h-[min(92dvh,90vh)] overflow-y-auto touch-manipulation',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {!hideClose ? (
          <button
            type="button"
            onClick={() => context?.onOpenChange?.(false)}
            className="absolute right-3 top-3 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
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
