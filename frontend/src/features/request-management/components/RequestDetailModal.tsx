import { X } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  formatRequestCost,
  formatRequestCreatedAt,
  formatRequestedSummary,
} from '../lib/formatters'
import type { FleetRequest, RequestStatus } from '../types'

function detailStatusTone(status: RequestStatus): 'warning' | 'success' | 'danger' {
  if (status === 'pending') return 'warning'
  if (status === 'approved') return 'success'
  return 'danger'
}

function detailStatusLabel(status: RequestStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

interface RequestDetailModalProps {
  open: boolean
  request: FleetRequest | null
  onClose: () => void
  onApprove?: (request: FleetRequest) => void
  onReject?: (request: FleetRequest) => void
  decisionDisabled?: boolean
  allowDecisions?: boolean
}

export function RequestDetailModal({
  open,
  request,
  onClose,
  onApprove,
  onReject,
  decisionDisabled,
  allowDecisions = true,
}: RequestDetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false)

  if (!open || !request) {
    return null
  }

  const canDecide = request.status === 'pending'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close detail"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(90vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-[var(--shadow-ambient)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Request #{request.display_id}
            </p>
            <h2 id="request-detail-title" className="text-xl font-black tracking-tight text-foreground">
              Request detail
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={detailStatusLabel(request.status)}
                tone={detailStatusTone(request.status)}
              />
              <span className="text-xs text-muted-foreground">
                Submitted {formatRequestCreatedAt(request.created_at)}
              </span>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
            <X className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Driver
              </p>
              <p className="font-semibold text-foreground">{request.driver.name}</p>
              {request.driver.vehicle_label ? (
                <p className="text-sm text-muted-foreground">{request.driver.vehicle_label}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Requested
              </p>
              <p className="font-semibold text-foreground">{formatRequestedSummary(request)}</p>
              {request.type === 'fuel' ? (
                <p className="text-sm text-muted-foreground">
                  Cost: {formatRequestCost(request.cost)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Notes
            </p>
            <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm leading-6 text-foreground">
              {request.notes?.trim() ? request.notes : 'No driver notes provided.'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Maintenance requested
              </p>
              <p className="text-sm text-foreground">
                {request.maintenance_requested?.trim() ? request.maintenance_requested : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Fuel requested
              </p>
              <p className="text-sm text-foreground">
                {request.fuel_requested?.trim() ? `${request.fuel_requested} L` : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Cost
              </p>
              <p className="text-sm text-foreground">{formatRequestCost(request.cost)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Invoice / receipt
            </p>
            {request.invoice_url && !imgFailed ? (
              <a
                href={request.invoice_url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg ring-1 ring-border/60"
              >
                <img
                  key={request.invoice_url}
                  src={request.invoice_url}
                  alt="Invoice attachment preview"
                  className="max-h-48 w-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              </a>
            ) : (
              <div className="rounded-lg bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                No invoice image on file.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Status history
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Status history will appear here when the audit trail API is connected.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-muted/30 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {canDecide && allowDecisions && onReject ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive ring-destructive/25 hover:bg-destructive/10"
              disabled={decisionDisabled}
              onClick={() => onReject(request)}
            >
              Reject
            </Button>
          ) : null}
          {canDecide && allowDecisions && onApprove ? (
            <Button type="button" disabled={decisionDisabled} onClick={() => onApprove(request)}>
              Approve
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
