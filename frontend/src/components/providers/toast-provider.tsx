import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type AppToastVariant = 'success' | 'error' | 'neutral'

export type AppToastState = {
  id: number
  variant: AppToastVariant
  message: string
}

type ToastContextValue = {
  pushToast: (variant: AppToastVariant, message: string) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AppToastState[]>([])

  const pushToast = useCallback((variant: AppToastVariant, message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, variant, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              t.variant === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : t.variant === 'error'
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-foreground'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
