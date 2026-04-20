import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface AddDriverModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function AddDriverModal({
  open,
  onClose,
  title = 'Add driver',
  description = 'Driver onboarding will connect to tenant APIs. This dialog is a UI placeholder.',
}: AddDriverModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="resource-modal-title" className="text-lg font-black text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-10 rounded-lg bg-muted ring-1 ring-border/60" />
          <div className="h-10 rounded-lg bg-muted ring-1 ring-border/60" />
          <div className="h-10 rounded-lg bg-muted ring-1 ring-border/60" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onClose}>
            Save draft
          </Button>
        </div>
      </div>
    </div>
  )
}
