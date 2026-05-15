import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Car, ClipboardCheck, List, Package, PackagePlus, Trash2, Truck, Undo2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'
import { useAuth } from '@/features/auth/AuthContext'
import {
  CreateVehicleModal,
  type CreateVehicleValues,
} from '@/features/fleet/components/CreateVehicleModal'
import { InventoryReconciliationCard } from '@/features/fleet/components/InventoryReconciliationCard'
import {
  VehicleClosingCountDrawer,
  VehicleInventoryAdjustmentDrawer,
  VehicleInventoryReturnDrawer,
  VehicleLoadInventoryDrawer,
  VehicleOpeningCountDrawer,
} from '@/features/fleet/inventory-actions/VehicleInventoryOperationDrawers'
import { ApiError } from '@/services/api/client'
import { deleteCar, updateCar } from '@/services/api/cars'
import { getCarInventory } from '@/services/api/inventory'
import { listTrips } from '@/services/api/trips'
import { cn } from '@/lib/utils'
import type { CarResource, TripListItem } from '@/services/api/types'

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

export function FleetVehicleProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { user } = useAuth()
  const qc = useQueryClient()

  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const canPostInventoryAdjustment =
    canManage && (user?.role === 'admin' || Boolean(user?.is_platform_admin))

  const carParam = id ?? ''
  const numericId = Number(carParam)
  const idValid = carParam !== '' && Number.isInteger(numericId) && numericId > 0

  const [editOpen, setEditOpen] = useState(false)
  const [openingDrawerOpen, setOpeningDrawerOpen] = useState(false)
  const [loadDrawerOpen, setLoadDrawerOpen] = useState(false)
  const [closingDrawerOpen, setClosingDrawerOpen] = useState(false)
  const [returnDrawerOpen, setReturnDrawerOpen] = useState(false)
  const [adjustmentDrawerOpen, setAdjustmentDrawerOpen] = useState(false)
  const [openingDrawerSession, setOpeningDrawerSession] = useState(0)
  const [loadDrawerSession, setLoadDrawerSession] = useState(0)
  const [closingDrawerSession, setClosingDrawerSession] = useState(0)
  const [returnDrawerSession, setReturnDrawerSession] = useState(0)
  const [adjustmentDrawerSession] = useState(0)

  const inventoryQuery = useQuery({
    queryKey: ['car-inventory', carParam],
    queryFn: () => getCarInventory(carParam),
    enabled: idValid,
  })

  const activeTripsQuery = useQuery({
    queryKey: ['trips', 'active', 'car', numericId] as const,
    queryFn: () => listTrips({ status: 'active', car_id: numericId }),
    enabled: idValid,
  })

  const activeTripId = useMemo(() => {
    for (const t of activeTripsQuery.data ?? []) {
      if (!tripIsActive(t)) continue
      const cid = tripCarId(t)
      if (cid === numericId) return t.id
    }
    return null
  }, [activeTripsQuery.data, numericId])

  const reportError = useCallback(
    (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Request failed.'
      pushToast('error', msg)
    },
    [pushToast],
  )

  const updateMutation = useMutation({
    mutationFn: ({ id: cid, values }: { id: number; values: CreateVehicleValues }) =>
      updateCar(cid, {
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
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['car-inventory', carParam] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      void inventoryQuery.refetch()
      setEditOpen(false)
      pushToast('success', 'Vehicle updated.')
    },
    onError: reportError,
  })

  const deleteMutation = useMutation({
    mutationFn: (cid: number) => deleteCar(cid),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Vehicle deleted.')
      navigate('/fleet-management')
    },
    onError: reportError,
  })

  const handleDelete = useCallback(() => {
    if (!canManage || !idValid) return
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return
    void deleteMutation.mutateAsync(numericId)
  }, [canManage, deleteMutation, idValid, numericId])

  if (!user) return null

  if (!idValid) {
    return <Navigate to="/fleet-management" replace />
  }

  if (inventoryQuery.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((k) => (
          <div key={k} className="h-40 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
        ))}
      </div>
    )
  }

  if (inventoryQuery.isError || !inventoryQuery.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm font-semibold text-destructive">
          {inventoryQuery.error instanceof Error ? inventoryQuery.error.message : 'Vehicle not found.'}
        </p>
        <Button type="button" className="mt-4 gap-2" variant="secondary" onClick={() => navigate('/fleet-management')}>
          <ArrowLeft className="size-4" />
          Back to fleet
        </Button>
      </div>
    )
  }

  const data = inventoryQuery.data
  const car = data.car

  if (!car) {
    return (
      <div className="rounded-xl border border-border/30 bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">No vehicle record returned for this inventory view.</p>
        <Button type="button" className="mt-4 gap-2" variant="secondary" onClick={() => navigate('/fleet-management')}>
          <ArrowLeft className="size-4" />
          Back to fleet
        </Button>
      </div>
    )
  }

  const model = pickString(car.model).trim() || 'Vehicle'
  const plate = pickString(car.plate_number).trim()
  const color = pickString(car.color).trim()
  const updatedAt = formatDetailDate(car.updated_at)
  const pending = updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <Button
        type="button"
        variant="ghost"
        className="-ml-2 gap-2 text-muted-foreground"
        onClick={() => navigate('/fleet-management')}
      >
        <ArrowLeft className="size-4" />
        All vehicles
      </Button>

      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Truck className="size-7" aria-hidden />
            </div>
            <div className="min-w-0 space-y-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">{model}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Car className="size-4 shrink-0" aria-hidden />
                    {plate || '—'}
                  </span>
                  <Badge variant="secondary" className="normal-case">
                    Car #{pickString(car.id) || carParam}
                  </Badge>
                  {updatedAt !== '—' ? <span>Updated {updatedAt}</span> : null}
                </div>
                {activeTripId ? (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Active trip: </span>
                    <Link
                      to={`/trip-management/${activeTripId}`}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Trip #{activeTripId}
                    </Link>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No active trip for this vehicle.</p>
                )}
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditOpen(true)}>
                Edit vehicle
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {canManage ? (
        <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" aria-hidden />
                <h2 className="text-base font-bold text-foreground">Operational inventory</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Fast field workflows stay on this page: opening counts establish the audit baseline, loads add stock,
                closing count reconciles against the saved opening snapshot, returns post stock back with notes, and
                adjustment (admins) corrects on-hand quantities.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
              <Button
                type="button"
                className="w-full justify-center gap-2 sm:justify-start"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setOpeningDrawerSession((s) => s + 1)
                  setOpeningDrawerOpen(true)
                }}
              >
                <ClipboardCheck className="size-4" aria-hidden />
                Opening count
              </Button>
              <Button
                type="button"
                className="w-full justify-center gap-2 sm:justify-start"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setLoadDrawerSession((s) => s + 1)
                  setLoadDrawerOpen(true)
                }}
              >
                <PackagePlus className="size-4" aria-hidden />
                Load inventory
              </Button>
              <Button
                type="button"
                className="w-full justify-center gap-2 border-primary/60 sm:justify-start"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setClosingDrawerSession((s) => s + 1)
                  setClosingDrawerOpen(true)
                }}
              >
                <Package className="size-4" aria-hidden />
                Closing count
              </Button>
              <Button
                type="button"
                className="w-full justify-center gap-2 sm:justify-start"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setReturnDrawerSession((s) => s + 1)
                  setReturnDrawerOpen(true)
                }}
              >
                <Undo2 className="size-4" aria-hidden />
                Return
              </Button>
              {/* {canPostInventoryAdjustment ? (
                <Button
                  type="button"
                  className="w-full justify-center gap-2 sm:justify-start"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => {
                    setAdjustmentDrawerSession((s) => s + 1)
                    setAdjustmentDrawerOpen(true)
                  }}
                >
                  <SlidersHorizontal className="size-4" aria-hidden />
                  Adjustment
                </Button>
              ) : null} */}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-bold text-foreground">Vehicle details</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
              <span className="font-medium text-muted-foreground">Model</span>
              <span className="font-bold text-foreground">{model}</span>
            </li>
            <li className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
              <span className="font-medium text-muted-foreground">Plate</span>
              <span className="font-bold text-foreground">{plate || '—'}</span>
            </li>
            <li className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
              <span className="font-medium text-muted-foreground">Color</span>
              <span className="font-bold text-foreground">{color || '—'}</span>
            </li>
            <li className="flex items-center justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
              <span className="font-medium text-muted-foreground">Capacities</span>
              <span className="text-right font-bold text-foreground">
                Vol {pickString(car.overall_volume_capacity) || '—'} · Wt{' '}
                {pickString(car.overall_weight_capacity) || '—'}
              </span>
            </li>
          </ul>
        </div>

        <div className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-bold text-foreground">Snapshot summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
              <span className="font-medium text-muted-foreground">Products on hand</span>
              <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {data.snapshot.length}
              </span>
            </li>
            <li className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
              <span className="font-medium text-muted-foreground">Transaction lines</span>
              <span className="font-bold tabular-nums text-foreground">{data.transactions.length}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold text-foreground">On-hand inventory</h2>
        </div>
        <div className="mt-4 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Product
                </th>
                <th className="py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.snapshot.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-muted-foreground">
                    No snapshot lines for this vehicle.
                  </td>
                </tr>
              ) : (
                data.snapshot.map((row) => (
                  <tr key={row.product_id}>
                    <td className="py-3 pr-4 font-medium text-foreground">{row.product_name}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{row.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <InventoryReconciliationCard transactions={data.transactions} reconciliation={data.reconciliation} />

      <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2">
          <List className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold text-foreground">Inventory transactions</h2>
        </div>
        <div className="mt-4 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-3 pr-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">#</th>
                <th className="py-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Type
                </th>
                <th className="py-3 pr-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Product
                </th>
                <th className="py-3 pr-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Qty
                </th>
                <th className="py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                data.transactions.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-3 tabular-nums text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="normal-case">
                        {row.type}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium text-foreground">{row.product_name}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">{row.quantity}</td>
                    <td className={cn('py-3 text-xs text-muted-foreground whitespace-nowrap')}>
                      {formatDetailDate(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreateVehicleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        initialValues={carToFormValues(car)}
        submitting={updateMutation.isPending}
        onSubmit={(values) => updateMutation.mutate({ id: numericId, values })}
      />

      <VehicleOpeningCountDrawer
        key={`vehicle-opening-${openingDrawerSession}`}
        open={openingDrawerOpen}
        onClose={() => setOpeningDrawerOpen(false)}
        carId={numericId}
        tripId={activeTripId}
      />
      <VehicleLoadInventoryDrawer
        key={`vehicle-load-${loadDrawerSession}`}
        open={loadDrawerOpen}
        onClose={() => setLoadDrawerOpen(false)}
        carId={numericId}
        tripId={activeTripId}
      />
      <VehicleClosingCountDrawer
        key={`vehicle-closing-${closingDrawerSession}`}
        open={closingDrawerOpen}
        onClose={() => setClosingDrawerOpen(false)}
        carId={numericId}
        tripId={activeTripId}
      />
      <VehicleInventoryReturnDrawer
        key={`vehicle-return-${returnDrawerSession}`}
        open={returnDrawerOpen}
        onClose={() => setReturnDrawerOpen(false)}
        carId={numericId}
        tripId={activeTripId}
        snapshot={data.snapshot}
      />
      {canPostInventoryAdjustment ? (
        <VehicleInventoryAdjustmentDrawer
          key={`vehicle-adjustment-${adjustmentDrawerSession}`}
          open={adjustmentDrawerOpen}
          onClose={() => setAdjustmentDrawerOpen(false)}
          carId={numericId}
          tripId={activeTripId}
        />
      ) : null}
    </div>
  )
}