import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { FilterBar } from '@/components/FilterBar'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { useToast } from '@/components/providers/toast-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { type CreateTripValues, CreateTripModal } from '@/features/trips/components/CreateTripModal'
import { useTripMutations, useTripsQuery } from '@/features/trips/hooks/useTripQueries'
import { PaginationBar } from '@/features/resource-management/components/PaginationBar'
import { ApiError } from '@/services/api/client'
import { listCars } from '@/services/api/cars'
import { listDrivers } from '@/services/api/drivers'
import { listZones } from '@/services/api/zones'
import type { ListTripsQuery } from '@/services/api/trips'
import type { CarResource, DriverResource, TripListItem, ZoneResource } from '@/services/api/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

type AppliedFilters = {
  search: string
  status: 'all' | 'active' | 'closed'
  driverId: string
  zoneId: string
  dateFrom: string
  dateTo: string
}

const DEFAULT_FILTERS: AppliedFilters = {
  search: '',
  status: 'all',
  driverId: '',
  zoneId: '',
  dateFrom: '',
  dateTo: '',
}

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function formatTripDate(iso: unknown): string {
  const s = pickString(iso).trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function tripDriverName(t: TripListItem): string {
  const d = t.driver as DriverResource | undefined | null
  return (d?.full_name ?? '').trim() || '—'
}

function tripZoneSubtitle(t: TripListItem): string {
  const z = t.zone as ZoneResource | Record<string, unknown> | undefined | null
  if (z && typeof z === 'object') {
    const name = pickString((z as ZoneResource).name).trim()
    const city = pickString((z as ZoneResource).city).trim()
    if (name && city) return `${name} · ${city}`
    if (name) return name
    if (city) return city
  }
  const dest = pickString(t.destination).trim()
  return dest || 'No zone'
}

function tripVehicleLabel(t: TripListItem): { model: string; plate: string } {
  const c = t.car as CarResource | undefined | null
  return {
    model: pickString(c?.model).trim() || '—',
    plate: pickString(c?.plate_number).trim(),
  }
}

function tripRawStatus(t: TripListItem): string {
  return pickString(t.status).toLowerCase() || 'active'
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase()
  const n = name.trim()
  if (n.length >= 2) return n.slice(0, 2).toUpperCase()
  return (n.slice(0, 1) || '?').toUpperCase()
}

function avatarHueSeed(id: number): number {
  const hues = [215, 142, 35, 280, 175, 325]
  return hues[Math.abs(id) % hues.length]!
}

function dateKeyIso(iso: unknown): string | null {
  const s = pickString(iso).trim()
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function passesSearch(t: TripListItem, q: string): boolean {
  if (!q.trim()) return true
  const needle = q.toLowerCase()
  const driver = tripDriverName(t).toLowerCase()
  const zone = tripZoneSubtitle(t).toLowerCase()
  const { model, plate } = tripVehicleLabel(t)
  const carStr = `${model} ${plate}`.toLowerCase()
  const idStr = String(t.id)
  return (
    driver.includes(needle) || zone.includes(needle) || carStr.includes(needle) || idStr.includes(needle)
  )
}

function passesDateRange(t: TripListItem, from: string, to: string): boolean {
  if (!from && !to) return true
  const keys = [dateKeyIso((t as { start_date?: unknown }).start_date), dateKeyIso(t.created_at)].filter(
    Boolean,
  ) as string[]
  const effective = keys[0]
  if (!effective) return true
  if (from && effective < from) return false
  if (to && effective > to) return false
  return true
}

function passesStatus(t: TripListItem, status: AppliedFilters['status']): boolean {
  if (status === 'all') return true
  const raw = tripRawStatus(t)
  if (status === 'closed') return raw === 'closed'
  return raw !== 'closed'
}

function passesZoneSelection(t: TripListItem, zoneId: string): boolean {
  if (!zoneId) return true
  const wanted = Number(zoneId)
  if (!Number.isInteger(wanted) || wanted <= 0) return true
  const z = t.zone as ZoneResource | null | undefined
  const tid = z && typeof z === 'object' ? Number((z as ZoneResource).id) : NaN
  return Number.isInteger(tid) && tid === wanted
}

export function TripManagementPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()

  const canCreateOrDelete = user?.role === 'admin' || user?.role === 'manager'

  const [driverScopeId, setDriverScopeId] = useState<number | null>(null)
  useEffect(() => {
    if (user?.role !== 'driver' || !user?.name) {
      setDriverScopeId(null)
      return
    }
    let cancelled = false
    void listDrivers({ per_page: 100, search: user.name }).then(({ items }) => {
      const currentUserName = user.name?.trim() ?? ''
      const match = items.find((d) => (d.full_name ?? '').trim() === currentUserName)
      if (!cancelled) setDriverScopeId(match?.id ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [user?.role, user?.name])

  const [draft, setDraft] = useState<AppliedFilters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<AppliedFilters>(DEFAULT_FILTERS)

  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const apiFilters = useMemo<ListTripsQuery>(() => {
    if (user?.role === 'driver' && driverScopeId != null) {
      return { driver_id: driverScopeId }
    }
    const p: ListTripsQuery = {}
    if (applied.driverId) {
      const id = Number(applied.driverId)
      if (Number.isInteger(id) && id > 0) p.driver_id = id
    }
    if (applied.zoneId) {
      const id = Number(applied.zoneId)
      if (Number.isInteger(id) && id > 0) p.zone_id = id
    }
    if (applied.status !== 'all') {
      p.status = applied.status === 'closed' ? 'closed' : 'active'
    }
    if (applied.dateFrom) p.date_from = applied.dateFrom
    if (applied.dateTo) p.date_to = applied.dateTo
    return p
  }, [
    applied.dateFrom,
    applied.dateTo,
    applied.driverId,
    applied.status,
    applied.zoneId,
    driverScopeId,
    user?.role,
  ])

  const tripsQuery = useTripsQuery(apiFilters)
  const { remove, create } = useTripMutations()

  const { data: createDriversRes, isError: createDriversError } = useQuery({
    queryKey: ['drivers', 'trip-list-options'],
    queryFn: () => listDrivers({ per_page: 500, sort: 'full_name', direction: 'asc' }),
    enabled: user?.role !== 'driver',
  })
  const { data: createZonesRes, isError: createZonesError } = useQuery({
    queryKey: ['zones', 'trip-list-options'],
    queryFn: () => listZones({ per_page: 500, sort: 'name', direction: 'asc' }),
    enabled: user?.role !== 'driver',
  })
  const { data: createCarsRes } = useQuery({
    queryKey: ['cars', 'trip-create-options'],
    queryFn: () => listCars({ per_page: 500, sort: 'id', direction: 'asc' }),
    enabled: canCreateOrDelete,
  })

  useEffect(() => {
    if (createDriversError || createZonesError) {
      pushToast('error', 'Could not load driver or zone options.')
    }
  }, [createDriversError, createZonesError, pushToast])

  useEffect(() => {
    setPage(1)
  }, [applied])

  const driverOptions = useMemo(
    () =>
      (createDriversRes?.items ?? []).map((d) => ({
        id: d.id,
        label: d.full_name || `Driver #${d.id}`,
      })),
    [createDriversRes],
  )

  const zoneOptions = useMemo(
    () =>
      (createZonesRes?.items ?? []).map((z) => ({
        id: z.id,
        label: z.name?.trim() ? z.name : `${z.city} #${z.id}`,
      })),
    [createZonesRes],
  )

  const createDriverOptions = driverOptions
  const createZoneOptions = useMemo(
    () =>
      (createZonesRes?.items ?? []).map((zone) => ({
        id: zone.id,
        label: zone.name || `${zone.city} #${zone.id}`,
      })),
    [createZonesRes],
  )
  const createCarOptions = useMemo(
    () =>
      (createCarsRes?.items ?? []).map((car) => ({
        id: car.id,
        label: `${car.model} (${car.plate_number})`,
      })),
    [createCarsRes],
  )

  const filteredTrips = useMemo(() => {
    const rows = tripsQuery.data ?? []
    let out = rows.slice()
    out = out.filter((t) => passesStatus(t, applied.status))
    out = out.filter((t) => passesZoneSelection(t, applied.zoneId))
    out = out.filter((t) => passesSearch(t, applied.search))
    out = out.filter((t) => passesDateRange(t, applied.dateFrom, applied.dateTo))
    const sortRecent = [...out].sort((a, b) => {
      const ta = pickString(a.created_at)
      const tb = pickString(b.created_at)
      return tb.localeCompare(ta)
    })
    return sortRecent
  }, [applied, tripsQuery.data])

  const total = filteredTrips.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pagedTrips = useMemo(
    () => filteredTrips.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredTrips, safePage],
  )

  const applyFilters = useCallback(() => {
    setApplied({ ...draft })
  }, [draft])

  const clearFilters = useCallback(() => {
    setDraft({ ...DEFAULT_FILTERS })
    setApplied({ ...DEFAULT_FILTERS })
  }, [])

  const reportError = useCallback(
    (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Request failed.'
      pushToast('error', msg)
    },
    [pushToast],
  )

  const handleDelete = useCallback(
    (trip: TripListItem) => {
      if (!canCreateOrDelete) return
      if (!window.confirm(`Delete trip #${trip.id}? This cannot be undone.`)) return
      void remove
        .mutateAsync(String(trip.id))
        .then(() => pushToast('success', 'Trip deleted.'))
        .catch(reportError)
    },
    [canCreateOrDelete, remove, pushToast, reportError],
  )

  const handleCreateTrip = useCallback(
    (values: CreateTripValues) => {
      const payload = {
        driver_id: Number(values.driver_id),
        car_id: Number(values.car_id),
        zone_id: values.zone_id ? Number(values.zone_id) : null,
        destination: values.destination.trim() || null,
        arrival_time: values.arrival_time.trim() || null,
        departure: values.departure.trim() || null,
      }

      void create
        .mutateAsync(payload)
        .then((trip) => {
          pushToast('success', 'Trip created.')
          setCreateModalOpen(false)
          navigate(`/trip-management/${trip.id}`)
        })
        .catch(reportError)
    },
    [create, navigate, pushToast, reportError],
  )

  if (tripsQuery.isLoading) {
    return (
      <div className="space-y-4 p-1">
        <LoadingSkeleton className="min-h-24 max-w-xl" />
        <LoadingSkeleton className="min-h-16 w-full" />
        <LoadingSkeleton className="min-h-80 w-full" />
      </div>
    )
  }

  if (tripsQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-destructive">
          {tripsQuery.error instanceof Error ? tripsQuery.error.message : 'Could not load trips.'}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => void tripsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Trip management"
        description="Plan and review trips across your fleet — filter by route, assignee, dates, search, open a trip profile, or create a new run."
        actions={
          canCreateOrDelete ? (
            <Button type="button" className="gap-2 shadow-sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Create trip
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        <FilterBar
          searchPlaceholder="Search trips by driver, zone, plate, trip #…"
          searchValue={draft.search}
          onSearchChange={(e) => setDraft((prev) => ({ ...prev, search: e.target.value }))}
          searchInputId="trip-list-search"
          searchAriaLabel="Search trips"
          searchDisabled={!!tripsQuery.error}
          searchContainerClassName="w-full max-w-none flex-1"
          className="flex-col md:flex-col"
          filters={
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" className="h-9" onClick={applyFilters}>
                  Search
                </Button>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                {user?.role !== 'driver' ? (
                  <>
                    <FilterSelect
                      label="Status"
                      value={draft.status}
                      onChange={(v) => setDraft((prev) => ({ ...prev, status: v as AppliedFilters['status'] }))}
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'closed', label: 'Closed' },
                      ]}
                      id="trip-filter-status"
                    />
                    <FilterSelect
                      label="Driver"
                      value={draft.driverId}
                      onChange={(v) => setDraft((prev) => ({ ...prev, driverId: v }))}
                      options={[
                        { value: '', label: 'All' },
                        ...driverOptions.map((d) => ({ value: String(d.id), label: d.label })),
                      ]}
                      id="trip-filter-driver"
                    />
                    <FilterSelect
                      label="Zone"
                      value={draft.zoneId}
                      onChange={(v) => setDraft((prev) => ({ ...prev, zoneId: v }))}
                      options={[
                        { value: '', label: 'All' },
                        ...zoneOptions.map((z) => ({ value: String(z.id), label: z.label })),
                      ]}
                      id="trip-filter-zone"
                    />
                  </>
                ) : (
                  <>
                    <FilterSelect
                      label="Status"
                      value={draft.status}
                      onChange={(v) => setDraft((prev) => ({ ...prev, status: v as AppliedFilters['status'] }))}
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'closed', label: 'Closed' },
                      ]}
                      id="trip-filter-status"
                    />
                    <FilterSelect
                      label="Zone"
                      value={draft.zoneId}
                      onChange={(v) => setDraft((prev) => ({ ...prev, zoneId: v }))}
                      options={[
                        { value: '', label: 'All' },
                        ...zoneOptions.map((z) => ({ value: String(z.id), label: z.label })),
                      ]}
                      id="trip-filter-zone"
                    />
                  </>
                )}

                <div className="flex min-w-[140px] flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="trip-date-from">
                    Created from
                  </label>
                  <input
                    id="trip-date-from"
                    type="date"
                    value={draft.dateFrom}
                    onChange={(e) => setDraft((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    className="h-9 rounded-lg border border-border/60 bg-surface-lowest px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex min-w-[140px] flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="trip-date-to">
                    Created to
                  </label>
                  <input
                    id="trip-date-to"
                    type="date"
                    value={draft.dateTo}
                    onChange={(e) => setDraft((prev) => ({ ...prev, dateTo: e.target.value }))}
                    className="h-9 rounded-lg border border-border/60 bg-surface-lowest px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <Button type="button" size="sm" className="h-9 shrink-0" onClick={applyFilters}>
                  Apply filters
                </Button>
              </div>
            </div>
          }
        />
      </div>

      {user?.role === 'driver' && driverScopeId == null ? (
        <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          Your driver profile must match your user name to list trips. Ask an admin to align your account name with
          your driver record.
        </p>
      ) : (
        <section className="surface-panel overflow-hidden rounded-xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
          <div className="border-b border-border/60 bg-surface-high/20 px-4 py-4 sm:px-6">
            <h2 className="text-lg font-black tracking-tight text-primary">Trips</h2>
            <p className="mt-1 text-xs text-muted-foreground">Showing results for your current filters.</p>
          </div>

          <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="bg-surface-high/30">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    #
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Trip
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Start
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">End</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagedTrips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                      No trips match the current filters.
                    </td>
                  </tr>
                ) : (
                  pagedTrips.map((t) => {
                    const closed = tripRawStatus(t) === 'closed'
                    const driverLabel = tripDriverName(t)
                    const hue = avatarHueSeed(t.id)
                    const vehicle = tripVehicleLabel(t)
                    return (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15"
                      >
                        <td className="px-6 py-4 text-sm font-semibold tabular-nums text-foreground">{t.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                              style={{ backgroundColor: `hsl(${hue} 62% 48%)` }}
                              aria-hidden
                            >
                              {initialsFromName(driverLabel)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold leading-tight text-foreground">{driverLabel}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{tripZoneSubtitle(t)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground">{vehicle.model}</span>
                            {vehicle.plate ? <span className="text-xs text-muted-foreground">{vehicle.plate}</span> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={closed ? 'secondary' : 'success'} className="normal-case">
                            {closed ? 'Closed' : 'Active'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatTripDate((t as { start_date?: unknown }).start_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatTripDate((t as { end_date?: unknown }).end_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatTripDate(t.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-9 rounded-lg"
                              aria-label={`View trip ${t.id}`}
                              onClick={() => navigate(`/trip-management/${t.id}`)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            {canCreateOrDelete ? (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-9 rounded-lg text-destructive hover:text-destructive"
                                disabled={remove.isPending}
                                aria-label={`Delete trip ${t.id}`}
                                onClick={() => handleDelete(t)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            entityLabel="trips"
            onPageChange={setPage}
          />
        </section>
      )}

      <CreateTripModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        submitting={create.isPending}
        driverOptions={createDriverOptions}
        carOptions={createCarOptions}
        zoneOptions={createZoneOptions}
        onSubmit={handleCreateTrip}
      />
    </div>
  )
}

function FilterSelect({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 rounded-lg border border-border/60 bg-surface-lowest px-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30',
        )}
      >
        {options.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
