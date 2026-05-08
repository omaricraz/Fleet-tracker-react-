import { Loader2, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { FleetRequest, RequestDecisionAction } from '../types'

interface RequestDecisionModalProps {
  open: boolean
  action: RequestDecisionAction | null
  request: FleetRequest | null
  loading: boolean
  onClose: () => void
  onConfirm: (input: { action: RequestDecisionAction; reason?: string }) => Promise<void>
}

export function RequestDecisionModal({
  open,
  action,
  request,
  loading,
  onClose,
  onConfirm,
}: RequestDecisionModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open || !action || !request) {
    return null
  }

  const title = action === 'approve' ? 'Approve request' : 'Reject request'
  const description =
    action === 'approve'
      ? `Confirm approval for ${request.display_id}. The driver will be notified when the workflow API is wired.`
      : `Reject ${request.display_id}. A clear reason helps drivers correct issues faster.`

  async function submit() {
    if (!action) return
    if (action === 'reject') {
      const r = reason.trim()
      if (r.length < 3) {
        setError('Enter at least 3 characters for the rejection reason.')
        return
      }
      await onConfirm({ action, reason: r })
      return
    }
    await onConfirm({ action })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-decision-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        aria-label="Close confirmation"
        onClick={() => {
          if (!loading) onClose()
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="request-decision-title" className="text-lg font-black text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={loading}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>

        {action === 'reject' ? (
          <div className="mt-5 space-y-2">
            <label htmlFor="reject-reason" className="text-xs font-bold text-muted-foreground">
              Rejection reason
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={loading}
              className="w-full resize-y rounded-md border-0 bg-muted px-4 py-3 text-sm text-foreground outline-none ring-1 ring-transparent transition focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60"
              placeholder="Explain why this request cannot be approved…"
            />
            {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={action === 'reject' ? 'outline' : 'default'}
            className={
              action === 'reject'
                ? 'text-destructive ring-destructive/25 hover:bg-destructive/10'
                : undefined
            }
            disabled={loading}
            onClick={() => void submit()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Processing
              </>
            ) : action === 'approve' ? (
              'Approve'
            ) : (
              'Reject request'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
