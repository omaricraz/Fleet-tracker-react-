import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface OperationalDrawerShellProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  busy?: boolean
  children: ReactNode
  footer: ReactNode
  /** Wider drawer for audit tables */
  size?: 'md' | 'lg' | 'xl'
}

export function OperationalDrawerShell({
  open,
  title,
  subtitle,
  onClose,
  busy = false,
  children,
  footer,
  size = 'md',
}: OperationalDrawerShellProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-foreground/55 backdrop-blur-[2px] transition-opacity"
        disabled={busy}
        onClick={() => {
          if (!busy) onClose()
        }}
      />
      <aside
        className={cn(
          'relative flex h-full w-full flex-col border-l border-border/60 bg-card shadow-[var(--shadow-ambient)]',
          size === 'md' && 'max-w-md',
          size === 'lg' && 'max-w-xl sm:max-w-2xl',
          size === 'xl' && 'max-w-2xl sm:max-w-3xl',
        )}
      >
        <header className="shrink-0 border-b border-border/50 bg-surface-lowest/80 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="eyebrow text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                Operations
              </span>
              <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">{title}</h2>
              {subtitle ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p> : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled={busy}
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-5" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        <footer className="sticky bottom-0 z-10 border-t border-border/60 bg-card/95 px-5 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/85">
          {footer}
        </footer>
      </aside>
    </div>
  )
}
