import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { FilterBar } from '@/components/FilterBar'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { useToast } from '@/components/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import {
  CreateVehicleModal,
  type CreateVehicleValues,
} from '@/features/fleet/components/CreateVehicleModal'
import { fleetVehicleProfilePath } from '@/features/fleet/fleetPaths'
import { PaginationBar } from '@/features/resource-management/components/PaginationBar'
import { useTripsQuery } from '@/features/trips/hooks/useTripQueries'
import { ApiError } from '@/services/api/client'
import { createCar, deleteCar, listCars, updateCar } from '@/services/api/cars'
import type { CarResource, TripListItem } from '@/services/api/types'

const PAGE_SIZE = 10

type AppliedFilters = {
  search: string
}

const DEFAULT_FILTERS: AppliedFilters = {
  search: '',
}

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase()
  const n = label.trim()
  if (n.length >= 2) return n.slice(0, 2).toUpperCase()
  return (n.slice(0, 1) || '?').toUpperCase()
}

function avatarHueSeed(id: number): number {
  const hues = [215, 142, 35, 280, 175, 325]
  return hues[Math.abs(id) % hues.length]!
}

function tripCarId(t: TripListItem): number | null {
  const c = t.car as CarResource | undefined | null
  if (c?.id != null) return Number(c.id)
  const raw = (t as { car_id?: unknown }).car_id
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw
  return null
}

function tripIsActive(t: TripListItem): boolean {
  const st = pickString(t.status).toLowerCase()
  return st !== 'closed'
}

function carToFormValues(car: CarResource): CreateVehicleValues {
  return {
    model: car.model ?? '',
    plate_number: car.plate_number ?? '',
    color: typeof car.color === 'string' ? car.color : '',
    overall_volume_capacity:
      car.overall_volume_capacity != null && `${car.overall_volume_capacity}` !== ''
        ? String(car.overall_volume_capacity)
        : '',
    overall_weight_capacity:
      car.overall_weight_capacity != null && `${car.overall_weight_capacity}` !== ''
        ? String(car.overall_weight_capacity)
        : '',
  }
}

export function FleetManagementPage() {
  const qc = useQueryClient()
  const { pushToast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [draft, setDraft] = useState<AppliedFilters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<AppliedFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<CarResource | null>(null)

  const carsQuery = useQuery({
    queryKey: ['cars', 'fleet-list'],
    queryFn: () => listCars({ per_page: 500, sort: 'model', direction: 'asc' }),
  })

  const activeTripsQuery = useTripsQuery({ status: 'active' })

  const activeTripByCarId = useMemo(() => {
    const map = new Map<number, number>()
    for (const t of activeTripsQuery.data ?? []) {
      if (!tripIsActive(t)) continue
      const cid = tripCarId(t)
      if (cid != null && cid > 0) map.set(cid, t.id)
    }
    return map
  }, [activeTripsQuery.data])

  const mergedRows = useMemo(() => {
    const cars = carsQuery.data?.items ?? []
    let rows = cars.map((car) => {
      const label = `${car.model} · ${car.plate_number}`
      return { car, label }
    })

    const q = applied.search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) => {
        const hay = `${r.label} ${r.car.model} ${r.car.plate_number}`.toLowerCase()
        return hay.includes(q)
      })
    }

    rows.sort((a, b) => a.car.model.localeCompare(b.car.model))
    return rows
  }, [applied.search, carsQuery.data?.items])

  useEffect(() => {
    setPage(1)
  }, [applied])

  const total = mergedRows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedRows = useMemo(
    () => mergedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [mergedRows, safePage],
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

  const createCarMutation = useMutation({
    mutationFn: (values: CreateVehicleValues) =>
      createCar({
        model: values.model.trim(),
        plate_number: values.plate_number.trim(),
        color: values.color.trim() || null,
        overall_volume_capacity:
          values.overall_volume_capacity.trim() === '' ? null : Number(values.overall_volume_capacity),
        overall_weight_capacity:
          values.overall_weight_capacity.trim() === '' ? null : Number(values.overall_weight_capacity),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      setCreateModalOpen(false)
      pushToast('success', 'Vehicle created.')
    },
    onError: reportError,
  })

  const updateCarMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CreateVehicleValues }) =>
      updateCar(id, {
        model: values.model.trim(),
        plate_number: values.plate_number.trim(),
        color: values.color.trim() || null,
        overall_volume_capacity:
          values.overall_volume_capacity.trim() === '' ? null : Number(values.overall_volume_capacity),
        overall_weight_capacity:
          values.overall_weight_capacity.trim() === '' ? null : Number(values.overall_weight_capacity),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      void qc.invalidateQueries({ queryKey: ['car-inventory'] })
      setEditingCar(null)
      pushToast('success', 'Vehicle updated.')
    },
    onError: reportError,
  })

  const deleteCarMutation = useMutation({
    mutationFn: (id: number) => deleteCar(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      void qc.invalidateQueries({ queryKey: ['car-inventory', String(id)] })
      pushToast('success', 'Vehicle deleted.')
    },
    onError: reportError,
  })

  const handleDelete = useCallback(
    (car: CarResource) => {
      if (!canManage) return
      if (!window.confirm(`Delete vehicle ${car.model} (${car.plate_number})? This cannot be undone.`)) return
      void deleteCarMutation.mutateAsync(car.id)
    },
    [canManage, deleteCarMutation],
  )

  const loading = carsQuery.isLoading
  const loadError = carsQuery.isError

  if (!user) return null

  if (loading) {
    return (
      <div className="space-y-4 p-1">
        <LoadingSkeleton className="min-h-24 max-w-xl" />
        <LoadingSkeleton className="min-h-16 w-full" />
        <LoadingSkeleton className="min-h-80 w-full" />
      </div>
    )
  }

  if (loadError) {
    const err = carsQuery.error
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-destructive">
          {err instanceof Error ? err.message : 'Could not load fleet data.'}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => {
            void carsQuery.refetch()
          }}
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
        title="Fleet management"
        description="Browse vehicles, jump to an active trip, open a vehicle profile for per-vehicle inventory, or maintain catalog entries."
        actions={
          canManage ? (
            <Button type="button" className="gap-2 shadow-sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Add vehicle
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        <FilterBar
          searchPlaceholder="Search vehicles by model or plate…"
          searchValue={draft.search}
          onSearchChange={(e) => setDraft((prev) => ({ ...prev, search: e.target.value }))}
          searchInputId="fleet-list-search"
          searchAriaLabel="Search fleet vehicles"
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
            </div>
          }
        />
      </div>

      <section className="surface-panel overflow-hidden rounded-xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border/60 bg-surface-high/20 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-black tracking-tight text-primary">Vehicles</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Open a vehicle profile to view inventory (/api/v1/cars/{'{id}'}/inventory).
          </p>
        </div>

        <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="bg-surface-high/30">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  #
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Vehicle
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Inventory
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Active trip
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                    No vehicles match the current filters.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, idx) => {
                  const car = row.car
                  const hue = avatarHueSeed(car.id)
                  const tripId = activeTripByCarId.get(car.id)
                  return (
                    <tr
                      key={car.id}
                      className="transition-colors hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15"
                    >
                      <td className="px-6 py-4 text-sm font-semibold tabular-nums text-foreground">
                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                            style={{ backgroundColor: `hsl(${hue} 62% 48%)` }}
                            aria-hidden
                          >
                            {initialsFromLabel(row.label)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight text-foreground">{car.model}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{car.plate_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">See vehicle profile</span>
                      </td>
                      <td className="px-6 py-4">
                        {tripId ? (
                          <Link
                            to={`/trip-management/${tripId}`}
                            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            Trip #{tripId}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-9 rounded-lg"
                            aria-label={`View vehicle ${car.id}`}
                            onClick={() => navigate(fleetVehicleProfilePath(car.id))}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canManage ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-9 rounded-lg"
                                aria-label={`Edit vehicle ${car.id}`}
                                onClick={() => setEditingCar(car)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-9 rounded-lg text-destructive hover:text-destructive"
                                disabled={deleteCarMutation.isPending}
                                aria-label={`Delete vehicle ${car.id}`}
                                onClick={() => handleDelete(car)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
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
          entityLabel="vehicles"
          onPageChange={setPage}
        />
      </section>

      <CreateVehicleModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        submitting={createCarMutation.isPending}
        onSubmit={(values) => createCarMutation.mutate(values)}
      />

      <CreateVehicleModal
        open={Boolean(editingCar)}
        onClose={() => setEditingCar(null)}
        mode="edit"
        initialValues={editingCar ? carToFormValues(editingCar) : null}
        submitting={updateCarMutation.isPending}
        onSubmit={(values) => {
          if (!editingCar) return
          updateCarMutation.mutate({ id: editingCar.id, values })
        }}
      />
    </div>
  )
}
