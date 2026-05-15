import { useCallback, type ReactNode } from 'react'
import { ArrowLeft, CalendarClock, Car, List, Package, Route, Trash2, Truck, User as UserIcon } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { fleetVehicleProfilePath } from '@/features/fleet/fleetPaths'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'
import { useAuth } from '@/features/auth/AuthContext'
import { useTripDetailQuery, useTripMutations } from '@/features/trips/hooks/useTripQueries'
import { ApiError } from '@/services/api/client'
import type { TripDetailData } from '@/services/api/types'
import { cn } from '@/lib/utils'

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function formatDetailDate(iso: unknown): string {
  const s = pickString(iso).trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatShortDate(iso: unknown): string {
  const s = pickString(iso).trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** HH:mm / optional seconds from trip schedule, or fallback to parsed datetime / raw text */
function formatTripClockOrDate(value: unknown): string {
  const s = pickString(value).trim()
  if (!s) return '—'

  const hhmm = s.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/)
  if (hhmm) {
    const hour24 = Number(hhmm[1])
    const minute = Number(hhmm[2])
    const suffix = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 % 12 || 12
    return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
  }

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return s
}

function isTripClosed(detail: TripDetailData | undefined): boolean {
  if (!detail?.trip || typeof detail.trip !== 'object') return false
  const st = pickString((detail.trip as Record<string, unknown>).status).toLowerCase()
  return st === 'closed'
}

export function TripProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const tripId = id ?? ''
  const numericId = Number(tripId)
  const idValid = tripId !== '' && Number.isInteger(numericId) && numericId > 0

  const { data, isLoading, isError, error, refetch } = useTripDetailQuery(idValid ? tripId : null)
  const { close, remove } = useTripMutations()

  const reportError = useCallback(
    (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Request failed.'
      pushToast('error', msg)
    },
    [pushToast],
  )

  const handleCloseTrip = useCallback(() => {
    if (!tripId) return
    if (!window.confirm('Close this trip?')) return
    void close
      .mutateAsync(tripId)
      .then(() => {
        pushToast('success', 'Trip closed.')
        void refetch()
      })
      .catch(reportError)
  }, [close, pushToast, refetch, reportError, tripId])

  const handleDeleteTrip = useCallback(() => {
    if (!tripId || !canManage) return
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    void remove
      .mutateAsync(tripId)
      .then(() => {
        pushToast('success', 'Trip deleted.')
        navigate('/trip-management')
      })
      .catch(reportError)
  }, [canManage, navigate, pushToast, remove, reportError, tripId])

  if (!user) return null

  if (!idValid) {
    return <Navigate to="/trip-management" replace />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((k) => (
          <div key={k} className="h-40 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm font-semibold text-destructive">
          {error instanceof Error ? error.message : 'Trip not found.'}
        </p>
        <Button type="button" className="mt-4 gap-2" variant="secondary" onClick={() => navigate('/trip-management')}>
          <ArrowLeft className="size-4" />
          Back to trips
        </Button>
      </div>
    )
  }

  const tripRecord = data.trip as Record<string, unknown>
  const driverRecord = data.driver as Record<string, unknown>
  const carRecord = data.car as Record<string, unknown>
  const vehicleProfileCarId = Number(carRecord.id)
  const vehicleProfileHref =
    Number.isInteger(vehicleProfileCarId) && vehicleProfileCarId > 0
      ? fleetVehicleProfilePath(vehicleProfileCarId)
      : null
  const zoneRecord =
    typeof tripRecord.zone === 'object' && tripRecord.zone !== null
      ? (tripRecord.zone as Record<string, unknown>)
      : typeof tripRecord.zone_id === 'number'
        ? { id: tripRecord.zone_id }
        : {}

  const destination = pickString(tripRecord.destination).trim()
  const driverName = pickString(driverRecord.full_name).trim() || '—'
  const driverPhone = pickString(driverRecord.phone).trim() || '—'
  const closed = isTripClosed(data)
  const actionPending = close.isPending || remove.isPending

  const txs = data.inventory_summary?.transactions_by_type_for_trip
  const txEntries =
    txs && typeof txs === 'object' && !Array.isArray(txs)
      ? Object.entries(txs as Record<string, unknown>)
      : []

  const timeline = Array.isArray(data.timeline) ? data.timeline : []

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <Button type="button" variant="ghost" className="-ml-2 gap-2 text-muted-foreground" onClick={() => navigate('/trip-management')}>
        <ArrowLeft className="size-4" />
        All trips
      </Button>

      {/* Header card */}
      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Truck className="size-7" aria-hidden />
            </div>
            <div className="min-w-0 space-y-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Trip #{pickString(tripRecord.id) || tripId}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 shrink-0" aria-hidden />
                    {formatDetailDate(tripRecord.updated_at)}
                  </span>
                  <Badge variant={closed ? 'secondary' : 'success'} className="normal-case">
                    {closed ? 'Closed' : 'Active'}
                  </Badge>
                  <span className="inline-flex items-center gap-1.5">
                    <UserIcon className="size-4 shrink-0" aria-hidden />
                    {driverName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {closed ? null : (
              <Button type="button" variant="secondary" disabled={!canManage || actionPending} onClick={handleCloseTrip}>
                Close trip
              </Button>
            )}
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={actionPending}
                onClick={handleDeleteTrip}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Summary row: route + transactions (reference: message + delivery) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-bold text-foreground">Route & notes</h2>
          <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
            {destination ? (
              <p>{destination}</p>
            ) : (
              <p className="text-muted-foreground">No destination recorded for this trip.</p>
            )}
          </div>
        </div>

        <div className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-bold text-foreground">Transactions</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {txEntries.length === 0 ? (
              <li className="text-muted-foreground">No transaction counts.</li>
            ) : (
              txEntries.map(([key, val]) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-4 border-b border-border/40 pb-2 last:border-0"
                >
                  <span className="font-medium capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold tabular-nums text-foreground">{pickString(val)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Trip details grid */}
      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-base font-bold text-foreground">Trip details</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserIcon className="mt-0.5 size-5 text-primary" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Driver</p>
                <p className="font-semibold text-foreground">{driverName}</p>
                <p className="text-sm text-muted-foreground">{driverPhone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car className="mt-0.5 size-5 text-primary" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle</p>
                {vehicleProfileHref ? (
                  <Link
                    to={vehicleProfileHref}
                    className="block rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <p className="font-semibold text-primary underline-offset-4 hover:underline">
                      {pickString(carRecord.model) || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">{pickString(carRecord.plate_number) || '—'}</p>
                    {pickString(carRecord.color) ? (
                      <p className="text-sm text-muted-foreground">Color: {pickString(carRecord.color)}</p>
                    ) : null}
                  </Link>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">{pickString(carRecord.model) || '—'}</p>
                    <p className="text-sm text-muted-foreground">{pickString(carRecord.plate_number) || '—'}</p>
                    {pickString(carRecord.color) ? (
                      <p className="text-sm text-muted-foreground">Color: {pickString(carRecord.color)}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <DetailRow label="Zone / city" value={pickString(zoneRecord.city) || pickString(zoneRecord.name) || '—'} icon={<Route className="size-4" />} />
            <DetailRow
              label="Start"
              value={formatShortDate(tripRecord.start_date)}
              icon={<CalendarClock className="size-4" />}
            />
            <DetailRow label="End" value={formatShortDate(tripRecord.end_date)} icon={<CalendarClock className="size-4" />} />
            <DetailRow
              label="Arrival"
              value={formatTripClockOrDate(tripRecord.arrival_time)}
              icon={<CalendarClock className="size-4" />}
            />
            <DetailRow
              label="Departure time"
              value={formatTripClockOrDate(tripRecord.departure)}
              icon={<CalendarClock className="size-4" />}
            />
            <DetailRow
              label="Volume capacity"
              value={pickString(tripRecord.volume_capacity) || '—'}
              icon={<Package className="size-4" />}
            />
            <DetailRow
              label="Weight capacity"
              value={pickString(tripRecord.weight_capacity) || '—'}
              icon={<Package className="size-4" />}
            />
          </div>
        </div>
      </section>

      {/* Inventory on hand */}
      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2">
          <List className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold text-foreground">Inventory on hand</h2>
        </div>
        <div className="mt-4 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Product</th>
                <th className="py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(data.inventory_summary?.on_hand ?? []).length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-muted-foreground">
                    No on-hand lines.
                  </td>
                </tr>
              ) : (
                (data.inventory_summary?.on_hand ?? []).map((row) => (
                  <tr key={row.product_id}>
                    <td className="py-3 pr-4 font-medium text-foreground">{row.product_name}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{row.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">Transactions by type</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {txEntries.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">No transaction counts for this trip.</p>
          ) : (
            txEntries.map(([key, val]) => (
              <div key={key} className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-lg font-black text-foreground">{pickString(val)}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Sales summary */}
      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-base font-bold text-foreground">Sales summary</h2>
        <div className="mt-4 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Product</th>
                <th className="py-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Qty</th>
                <th className="py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(data.sales_summary ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    No recorded sales on this trip.
                  </td>
                </tr>
              ) : (
                (data.sales_summary ?? []).map((row) => (
                  <tr key={`${row.product_id}-${row.quantity}`}>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {data.inventory_summary?.on_hand.find((p) => p.product_id === row.product_id)?.product_name ??
                        `Product #${row.product_id}`}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">{row.quantity}</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      ${pickString(row.total_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Timeline */}
      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-base font-bold text-foreground">Timeline</h2>
        <div className="relative mt-6 space-y-0 pl-2">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events.</p>
          ) : (
            timeline.map((evt, idx) => {
              const title = pickString(evt.event_type).trim() || 'Update'
              const metaParts: string[] = []
              if (evt.quantity != null && `${evt.quantity}` !== '') metaParts.push(`Qty ${pickString(evt.quantity)}`)
              if (evt.amount != null && `${evt.amount}` !== '') metaParts.push(`Amt ${pickString(evt.amount)}`)
              return (
                <div key={evt.id ?? `${title}-${evt.created_at}-${idx}`} className="relative flex gap-4 pb-8 pl-8 last:pb-0">
                  <div
                    className={cn(
                      'absolute bottom-0 left-[11px] top-8 w-px bg-border',
                      idx === timeline.length - 1 ? 'hidden' : '',
                    )}
                    aria-hidden
                  />
                  <div className="absolute left-0 top-1.5 flex size-[22px] items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-border/50 bg-muted/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold capitalize text-foreground">{title}</p>
                      <span className="text-xs text-muted-foreground">{formatDetailDate(evt.created_at)}</span>
                    </div>
                    {metaParts.length > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">{metaParts.join(' · ')}</p>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
