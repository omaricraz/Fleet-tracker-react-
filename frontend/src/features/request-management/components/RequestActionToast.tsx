import { useEffect } from 'react'

import { cn } from '@/lib/utils'

export type RequestToastVariant = 'success' | 'error'

export interface RequestToastState {
  message: string
  variant: RequestToastVariant
}

interface RequestActionToastProps {
  toast: RequestToastState | null
  onDismiss: () => void
}

export function RequestActionToast({ toast, onDismiss }: RequestActionToastProps) {
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(onDismiss, 4200)
    return () => window.clearTimeout(id)
  }, [toast, onDismiss])

  if (!toast) {
    return null
  }

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-6 right-4 z-[70] max-w-sm rounded-lg border px-4 py-3 text-sm font-semibold shadow-[var(--shadow-ambient)] sm:right-8',
        toast.variant === 'success'
          ? 'border-success/30 bg-card text-success'
          : 'border-destructive/30 bg-card text-destructive',
      )}
    >
      {toast.message}
    </div>
  )
}
