import { ArrowDownUp, Filter, Search } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/KpiCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { useToast } from '@/components/providers/toast-provider'
import { Button } from '@/components/ui/button'
import {
  CreateVehicleModal,
  type CreateVehicleValues,
} from '@/features/fleet/components/CreateVehicleModal'
import { FleetLoadMoreSection } from '@/features/fleet/components/FleetLoadMoreSection'
import { FleetVehicleCard } from '@/features/fleet/components/FleetVehicleCard'
import { filterFleetVehicles } from '@/features/fleet/filterFleet'
import { fleetKpis } from '@/features/fleet/mockFleetData'
import { mapCarToFleetVehicle } from '@/features/fleet/mapCar'
import type {
  CapacityFilter,
  FleetDetailTab,
  StatusFilter,
} from '@/features/fleet/types'
import { ApiError } from '@/services/api/client'
import { createCar, listCars } from '@/services/api/cars'
import {
  getDriverInventory,
  listInventory,
} from '@/services/api/inventory'
import {
  listFleetRequests,
  type FleetRequestApiRecord,
} from '@/services/api/requests'
import { cn } from '@/lib/utils'

const INITIAL_VISIBLE = 4

const statusSelectOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Status: All' },
  { value: 'available', label: 'Available' },
  { value: 'active', label: 'Active' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'maintenance', label: 'Maintenance' },
]

const capacitySelectOptions: { value: CapacityFilter; label: string }[] = [
  { value: 'all', label: 'Capacity: All' },
  { value: 'lt50', label: '< 50%' },
  { value: '50to90', label: '50% - 90%' },
  { value: 'gt90', label: '> 90%' },
]

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function requestTimestamp(request: FleetRequestApiRecord): number {
  const approved = toText(request.approved_at)
  const updated = toText(request.updated_at)
  const created = toText(request.created_at)
  const iso = approved ?? updated ?? created
  if (!iso) return 0
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function pickFuelRequestCost(request: FleetRequestApiRecord): number | null {
  return toNumber(request.cost) ?? toNumber(request.litre_cost)
}

function extractRequestCarId(request: FleetRequestApiRecord): number | null {
  const direct = toNumber(request.car_id)
  if (direct != null) return direct

  const data = toRecord(request.data)
  if (data) {
    const fromData = toNumber(data.car_id)
    if (fromData != null) return fromData
    const nestedCar = toRecord(data.car)
    if (nestedCar) {
      const nestedId = toNumber(nestedCar.id)
      if (nestedId != null) return nestedId
    }
  }

  const car = toRecord(request.car)
  if (car) {
    const carId = toNumber(car.id)
    if (carId != null) return carId
  }

  const trip = toRecord(request.trip)
  if (trip) {
    const tripCarId = toNumber(trip.car_id)
    if (tripCarId != null) return tripCarId
    const tripCar = toRecord(trip.car)
    if (tripCar) {
      const nested = toNumber(tripCar.id)
      if (nested != null) return nested
    }
  }

  return null
}

export function FleetManagementPage() {
  const qc = useQueryClient()
  const { pushToast } = useToast()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { data: carsData, isLoading, isError } = useQuery({
    queryKey: ['cars', 'fleet'],
    queryFn: () => listCars({ per_page: 100, sort: 'model', direction: 'asc' }),
  })

  const { data: approvedRequests = [] } = useQuery({
    queryKey: ['requests', 'fleet', 'approved'],
    queryFn: () => listFleetRequests({ status: 'approved' }),
  })

  const { data: inventoryRows = [] } = useQuery({
    queryKey: ['inventory', 'fleet'],
    queryFn: () => listInventory(),
  })

  const { data: driverInventory } = useQuery({
    queryKey: ['inventory', 'driver', 'fleet-page'],
    queryFn: () => getDriverInventory(),
    retry: false,
  })

  const fleetVehicles = useMemo(
    () => {
      const latestFuelByCar = new Map<number, FleetRequestApiRecord>()
      const latestMaintenanceByCar = new Map<number, FleetRequestApiRecord>()

      for (const request of approvedRequests) {
        const type = String(request.type ?? '').toLowerCase()
        if (type !== 'fuel' && type !== 'maintenance') continue
        const carId = extractRequestCarId(request)
        if (carId == null) continue

        const targetMap = type === 'fuel' ? latestFuelByCar : latestMaintenanceByCar
        const prev = targetMap.get(carId)
        if (!prev || requestTimestamp(request) >= requestTimestamp(prev)) {
          targetMap.set(carId, request)
        }
      }

      const snapshotByCar = new Map<
        number,
        Array<{ id: string; product: string; quantity: string }>
      >()
      for (const row of inventoryRows) {
        const items = row.items.map((item, idx) => ({
          id: `${row.car_id}-${item.product_id}-${idx}`,
          product: item.product_name,
          quantity: item.quantity,
        }))
        snapshotByCar.set(row.car_id, items)
      }

      if (driverInventory?.car?.id) {
        const driverCarId = Number(driverInventory.car.id)
        if (Number.isFinite(driverCarId) && !snapshotByCar.has(driverCarId)) {
          snapshotByCar.set(
            driverCarId,
            driverInventory.snapshot.map((item, idx) => ({
              id: `${driverCarId}-${item.product_id}-${idx}`,
              product: item.product_name,
              quantity: item.quantity,
            })),
          )
        }
      }

      return (carsData?.items ?? []).map((car, i) => {
        const fuelReq = latestFuelByCar.get(car.id)
        const maintReq = latestMaintenanceByCar.get(car.id)
        return mapCarToFleetVehicle(car, i, {
          latestApprovedFuel: fuelReq
            ? {
                id: String(fuelReq.id),
                createdAt:
                  toText(fuelReq.approved_at) ??
                  toText(fuelReq.updated_at) ??
                  toText(fuelReq.created_at) ??
                  undefined,
                liters: toText(fuelReq.fuel_requested),
                cost: pickFuelRequestCost(fuelReq),
              }
            : null,
          latestApprovedMaintenance: maintReq
            ? {
                id: String(maintReq.id),
                createdAt:
                  toText(maintReq.approved_at) ??
                  toText(maintReq.updated_at) ??
                  toText(maintReq.created_at) ??
                  undefined,
                detail: toText(maintReq.maintenance_requested),
                notes: toText(maintReq.notes),
              }
            : null,
          inventorySnapshot: snapshotByCar.get(car.id) ?? [],
        })
      })
    },
    [approvedRequests, carsData?.items, driverInventory, inventoryRows],
  )

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<FleetDetailTab>('fuel')
  const [driverOverrides, setDriverOverrides] = useState<Record<string, string>>({})
  const [showAll, setShowAll] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)

  const createCarMutation = useMutation({
    mutationFn: ({
      model,
      plate_number,
      color,
      overall_volume_capacity,
      overall_weight_capacity,
    }: CreateVehicleValues) =>
      createCar({
        model: model.trim(),
        plate_number: plate_number.trim(),
        color: color.trim() || null,
        overall_volume_capacity:
          overall_volume_capacity.trim() === '' ? null : Number(overall_volume_capacity),
        overall_weight_capacity:
          overall_weight_capacity.trim() === '' ? null : Number(overall_weight_capacity),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cars'] })
      setCreateModalOpen(false)
      pushToast('success', 'Vehicle created.')
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Could not create vehicle.'
      pushToast('error', msg)
    },
  })

  const filtered = useMemo(
    () =>
      filterFleetVehicles(
        fleetVehicles,
        search,
        statusFilter,
        capacityFilter,
        driverOverrides,
      ),
    [fleetVehicles, search, statusFilter, capacityFilter, driverOverrides],
  )

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const c = a.model.localeCompare(b.model)
      return sortAsc ? c : -c
    })
    return copy
  }, [filtered, sortAsc])

  const displayed = useMemo(
    () => (showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE)),
    [sorted, showAll],
  )

  const remainingCount = showAll ? 0 : Math.max(0, sorted.length - INITIAL_VISIBLE)

  useEffect(() => {
    setShowAll(false)
  }, [search, statusFilter, capacityFilter])

  useEffect(() => {
    setExpandedId((prev) => {
      if (!prev) return null
      if (sorted.some((v) => v.id === prev)) return prev
      return sorted[0]?.id ?? null
    })
  }, [sorted])

  function resolveDriver(vehicleId: string, defaultName: string | null) {
    if (driverOverrides[vehicleId] !== undefined) {
      return driverOverrides[vehicleId]
    }
    return defaultName === null ? 'Unassigned' : defaultName
  }

  function setDriver(vehicleId: string, value: string) {
    setDriverOverrides((prev) => ({
      ...prev,
      [vehicleId]: value,
    }))
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <PageHeader
          title="Fleet Management"
          description="Manage vehicles and historical operational data"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton className="min-h-[120px]" />
          <LoadingSkeleton className="min-h-[120px]" />
          <LoadingSkeleton className="min-h-[120px]" />
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 text-center text-destructive">
        Could not load vehicles. Verify <code className="text-sm">VITE_API_BASE_URL</code> and sign-in.
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">
      <PageHeader
        title="Fleet Management"
        description="Manage vehicles and historical operational data"
        actions={
          <Button type="button" size="lg" onClick={() => setCreateModalOpen(true)}>
            Add Vehicle
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total vehicles"
          value={String(fleetVehicles.length)}
          accent="primary"
        />
        <KpiCard
          label="Avg Capacity"
          value={fleetKpis.avgCapacity}
          delta={fleetKpis.avgCapacityDelta}
          accent="muted"
        />
        <KpiCard
          label="Avg Fuel Efficiency"
          value={fleetKpis.avgFuelEfficiency}
          deltaBadge={
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
              {fleetKpis.avgFuelBadge}
            </span>
          }
          accent="success"
        />
      </div>

      <div
        className={cn(
          'sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-4 border-b border-border/40 bg-background/90 py-4 backdrop-blur-md sm:-mx-6 sm:px-2 lg:-mx-10 lg:px-2',
        )}
      >
        <FilterBar
          searchPlaceholder="Search by model, plate, or driver..."
          searchAriaLabel="Search fleet by model, plate, or driver"
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchContainerClassName="max-w-none min-w-[240px] flex-1"
          className="w-full flex-1 border-0 bg-transparent p-0 shadow-none"
          filters={
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-xl border-0 bg-surface-lowest px-4 py-3 text-sm font-semibold text-primary shadow-sm ring-0 focus:ring-2 focus:ring-primary-fixed"
              >
                {statusSelectOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={capacityFilter}
                onChange={(e) =>
                  setCapacityFilter(e.target.value as CapacityFilter)
                }
                className="rounded-xl border-0 bg-surface-lowest px-4 py-3 text-sm font-semibold text-primary shadow-sm ring-0 focus:ring-2 focus:ring-primary-fixed"
              >
                {capacitySelectOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-xl bg-surface-lowest p-3 text-primary shadow-sm transition-colors hover:bg-surface-low"
                aria-label="Filter options"
              >
                <Filter className="size-5" />
              </button>
              <button
                type="button"
                className="rounded-xl bg-surface-lowest p-3 text-primary shadow-sm transition-colors hover:bg-surface-low"
                aria-label="Sort by vehicle name"
                onClick={() => setSortAsc((s) => !s)}
              >
                <ArrowDownUp className="size-5" />
              </button>
            </>
          }
        />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No vehicles match"
          description="Try adjusting search or filters to see fleet vehicles."
        />
      ) : (
        <div className="space-y-4">
          {displayed.map((vehicle) => (
            <FleetVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              expanded={expandedId === vehicle.id}
              onToggle={() =>
                setExpandedId((id) =>
                  id === vehicle.id ? null : vehicle.id,
                )
              }
              activeTab={detailTab}
              onTabChange={setDetailTab}
              driverDisplay={resolveDriver(vehicle.id, vehicle.driverName)}
              onDriverChange={(v) => setDriver(vehicle.id, v)}
            />
          ))}

          <FleetLoadMoreSection
            remainingCount={remainingCount}
            loaded={showAll}
            onLoadMore={() => setShowAll(true)}
          />
        </div>
      )}

      <CreateVehicleModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        submitting={createCarMutation.isPending}
        onSubmit={(values) => createCarMutation.mutate(values)}
      />
    </div>
  )
}
