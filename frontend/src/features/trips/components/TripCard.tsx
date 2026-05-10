import { Truck, User } from 'lucide-react'

import type { TripSummary } from '@/features/trips/types'
import { cn } from '@/lib/utils'

const borderByAccent: Record<TripSummary['borderAccent'], string> = {
  primary: 'border-l-4 border-l-primary',
  completed: 'border-l-4 border-l-[#0072bc]',
  delayed: 'border-l-4 border-l-destructive',
}

function StatusBadge({ status }: { status: TripSummary['status'] }) {
  if (status === 'active') {
    return (
      <span className="rounded bg-primary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
        Active
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
        Completed
      </span>
    )
  }
  return (
    <span className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
      Delayed
    </span>
  )
}

export interface TripCardProps {
  trip: TripSummary
  selected: boolean
  onSelect: () => void
  onEndTrip?: () => void
  actionPending?: boolean
}

export function TripCard({ trip, selected, onSelect, onEndTrip, actionPending = false }: TripCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'flex cursor-pointer flex-col gap-4 rounded-xl bg-surface-lowest p-5 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        borderByAccent[trip.borderAccent],
        trip.subdued && 'opacity-80 hover:opacity-100',
        selected && 'ring-2 ring-primary/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge status={trip.status} />
          <h3 className="mt-1 text-lg font-black text-primary">{trip.displayId}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-muted-foreground">{trip.timeLabel}</p>
          <p className="text-[10px] font-medium text-muted-foreground/90">{trip.zone}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-2">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-low">
            <User className="size-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Driver</p>
            <p className="truncate text-xs font-bold">{trip.driverName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-low">
            <Truck className="size-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Vehicle</p>
            <p className="truncate text-xs font-bold">{trip.vehicleLabel}</p>
          </div>
        </div>
      </div>

      {trip.status === 'active' ? (
        <div className="flex flex-col gap-3 rounded-lg bg-surface-low/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Live Stats</p>
            <p className="text-sm font-black text-primary">
              {trip.summaryAmount}{' '}
              <span className="text-xs font-medium text-muted-foreground">
                / {trip.summaryDistance}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!onEndTrip || actionPending}
              onClick={(e) => {
                e.stopPropagation()
                onEndTrip?.()
              }}
              className="rounded-md border border-[var(--outline-variant)] bg-white px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-high disabled:opacity-50"
            >
              End Trip
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              View
            </button>
          </div>
        </div>
      ) : null}

      {trip.status === 'completed' ? (
        <div className="flex flex-col gap-3 rounded-lg bg-surface-low/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              Financial Summary
            </p>
            <p className="text-sm font-black text-primary">
              {trip.summaryAmount}{' '}
              <span className="text-xs font-medium text-muted-foreground">
                / {trip.summaryDistance}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="rounded-md border border-[var(--outline-variant)] bg-white px-4 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-high"
          >
            Full Report
          </button>
        </div>
      ) : null}

      {trip.status === 'delayed' ? (
        <div className="flex flex-col gap-3 rounded-lg bg-destructive/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-destructive">Incident Summary</p>
            <p className="text-sm font-black text-destructive">
              {trip.summaryAmount}{' '}
              <span className="text-xs font-medium text-muted-foreground">
                / {trip.summaryDistance}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="rounded-md border border-destructive bg-white px-4 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/5"
          >
            Resolve
          </button>
        </div>
      ) : null}
    </article>
  )
}
