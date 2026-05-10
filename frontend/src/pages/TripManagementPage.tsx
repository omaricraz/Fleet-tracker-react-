import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useToast } from '@/components/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { type CreateTripValues, CreateTripModal } from '@/features/trips/components/CreateTripModal'
import { type InventoryActionMode, InventoryActionModal } from '@/features/trips/components/InventoryActionModal'
import { useTripDetailQuery, useTripMutations } from '@/features/trips/hooks/useTripQueries'
import { useTripOperationsQueries } from '@/features/trips/hooks/useTripOperationsQueries'
import { exportOperationsToCsv, filterTripOperationRows } from '@/features/trips/lib/filterOperationRows'
import { mapTripDetailToWorkspace } from '@/features/trips/lib/mapTrip'
import {
  aggregateSalesByTrip,
  computeCarStockValues,
  computeFleetOperationsKpis,
  countPendingRequestsByDriver,
  mapTripListItemToOperationRow,
} from '@/features/trips/lib/tripOperationsData'
import { TripOperationDrawer } from '@/features/trips/operations/trip-operation-drawer'
import { TripOperationsFilterBar } from '@/features/trips/operations/trip-operations-filter-bar'
import { TripOperationsKpiStrip } from '@/features/trips/operations/trip-operations-kpi-strip'
import { TripOperationsTable } from '@/features/trips/operations/trip-operations-table'
import type { TripOperationRow } from '@/features/trips/lib/tripOperationsData'
import {
  defaultTripOperationsFilters,
  type OperationDrawerTabId,
} from '@/features/trips/operations/types'
import type { FleetRequestApiRecord } from '@/services/api/requests'
import { ApiError } from '@/services/api/client'
import { listCars } from '@/services/api/cars'
import { listDrivers } from '@/services/api/drivers'
import { postCloseCount, postInventoryLoad, postOpeningBalance } from '@/services/api/inventory'
import { listProducts } from '@/services/api/products'
import { listZones } from '@/services/api/zones'
import type { ListTripsQuery } from '@/services/api/trips'
import type { TripListItem } from '@/services/api/types'
import { cn } from '@/lib/utils'

export function TripManagementPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [driverScopeId, setDriverScopeId] = useState<number | null>(null)
  const [filters, setFilters] = useState(defaultTripOperationsFilters)
  const [kpiFilterKey, setKpiFilterKey] = useState<string | null>(null)
  const [liveMode, setLiveMode] = useState(false)
  const [drawerTab, setDrawerTab] = useState<OperationDrawerTabId>('timeline')

  const canManageFleet = user?.role === 'admin' || user?.role === 'manager'
  const canOperateInventory =
    user?.role === 'driver' || user?.role === 'admin' || user?.role === 'manager'

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

  const listParams = useMemo<ListTripsQuery>(() => {
    if (user?.role === 'driver' && driverScopeId != null) {
      return { driver_id: driverScopeId }
    }
    const p: ListTripsQuery = {}
    if (filters.driverId) {
      const id = Number(filters.driverId)
      if (Number.isInteger(id) && id > 0) p.driver_id = id
    }
    if (filters.vehicleId) {
      const id = Number(filters.vehicleId)
      if (Number.isInteger(id) && id > 0) p.car_id = id
    }
    if (filters.tripStatus !== 'all') {
      p.status = filters.tripStatus
    }
    return p
  }, [user?.role, driverScopeId, filters.driverId, filters.vehicleId, filters.tripStatus])

  const {
    tripsQuery,
    salesQuery,
    alertsQuery,
    pendingRequestsQuery,
    fleetSnapshotQuery,
    productsById,
  } = useTripOperationsQueries({
    listParams,
    salesDateFrom: filters.dateFrom,
    salesDateTo: filters.dateTo,
    liveMode,
    loadFleetSnapshot: canManageFleet,
    loadAlerts: canManageFleet,
    loadPendingRequests: canManageFleet,
  })

  const rawTrips = tripsQuery.data ?? []
  const sales = salesQuery.data ?? []
  const alerts = (alertsQuery.data ?? undefined) as Record<string, unknown> | undefined
  const pendingReqs = pendingRequestsQuery.data ?? []

  const [selectedId, setSelectedId] = useState<string>('')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [inventoryActionOpen, setInventoryActionOpen] = useState(false)
  const [inventoryActionMode, setInventoryActionMode] = useState<InventoryActionMode | null>(null)
  const [closeCountPending, setCloseCountPending] = useState(false)
  const [openingPending, setOpeningPending] = useState(false)
  const [loadPending, setLoadPending] = useState(false)

  const { open, close, remove, create } = useTripMutations()
  const { data: detailData, isFetching: detailLoading } = useTripDetailQuery(selectedId || null)
  const { data: productsData } = useQuery({
    queryKey: ['products', 'trip-close-count'],
    queryFn: () => listProducts({ per_page: 500, sort: 'item', direction: 'asc' }),
  })

  const stockByCar = useMemo(() => {
    if (!fleetSnapshotQuery.data || !canManageFleet) return null
    return computeCarStockValues(fleetSnapshotQuery.data, productsById)
  }, [fleetSnapshotQuery.data, productsById, canManageFleet])

  const salesByTrip = useMemo(() => aggregateSalesByTrip(sales), [sales])
  const pendingByDriver = useMemo(() => countPendingRequestsByDriver(pendingReqs), [pendingReqs])

  const operationRows = useMemo(
    () =>
      rawTrips.map((t: TripListItem) =>
        mapTripListItemToOperationRow(t, salesByTrip, pendingByDriver, alerts, stockByCar),
      ),
    [rawTrips, salesByTrip, pendingByDriver, alerts, stockByCar],
  )

  const filteredRows = useMemo(
    () => filterTripOperationRows(operationRows, filters, kpiFilterKey),
    [operationRows, filters, kpiFilterKey],
  )

  const kpiCards = useMemo(
    () =>
      computeFleetOperationsKpis({
        trips: rawTrips,
        sales,
        alerts,
        pendingRequestCount: pendingReqs.filter(
          (r: FleetRequestApiRecord) => String(r.status).toLowerCase() === 'pending',
        ).length,
      }),
    [rawTrips, sales, alerts, pendingReqs],
  )

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId('')
      return
    }
    if (selectedId && !filteredRows.some((t: TripOperationRow) => t.id === selectedId)) {
      setSelectedId(filteredRows[0]!.id)
    }
  }, [filteredRows, selectedId])

  useEffect(() => {
    if (!selectedId && filteredRows.length > 0) {
      setSelectedId(filteredRows[0]!.id)
    }
  }, [filteredRows, selectedId])

  const workspaceDetail = useMemo(() => {
    if (!detailData) return null
    return mapTripDetailToWorkspace(detailData)
  }, [detailData])

  const selectTrip = useCallback((id: string) => {
    setSelectedId(id)
    setDrawerTab('timeline')
    setMobilePanelOpen(true)
  }, [])

  const reportError = useCallback(
    (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Request failed.'
      pushToast('error', msg)
    },
    [pushToast],
  )

  const handleInventoryActionOpen = useCallback((mode: InventoryActionMode) => {
    setInventoryActionMode(mode)
    setInventoryActionOpen(true)
  }, [])

  const handleInventoryActionSubmit = useCallback(
    (items: Array<{ product_id: number; quantity: number }>) => {
      if (!selectedId || !detailData?.car || typeof detailData.car !== 'object') {
        pushToast('error', 'Trip car is required to submit inventory action.')
        return
      }
      const carIdRaw = (detailData.car as { id?: unknown }).id
      const carId = Number(carIdRaw)
      if (!Number.isInteger(carId) || carId <= 0) {
        pushToast('error', 'Trip car is invalid for inventory action.')
        return
      }

      const tripId = Number(selectedId)
      const validTripId = Number.isInteger(tripId) && tripId > 0 ? tripId : null
      if (inventoryActionMode === 'opening') {
        setOpeningPending(true)
        void postOpeningBalance({
          trip_id: validTripId,
          items: items.map((item) => ({
            car_id: carId,
            product_id: item.product_id,
            actual_quantity: item.quantity,
          })),
        })
          .then(() => {
            pushToast('success', 'Opening balance submitted.')
            setInventoryActionOpen(false)
            setInventoryActionMode(null)
          })
          .catch(reportError)
          .finally(() => setOpeningPending(false))
        return
      }
      if (inventoryActionMode === 'load') {
        setLoadPending(true)
        void postInventoryLoad({
          cars: [{ car_id: carId, trip_id: validTripId, items }],
        })
          .then(() => {
            pushToast('success', 'Inventory load submitted.')
            setInventoryActionOpen(false)
            setInventoryActionMode(null)
          })
          .catch(reportError)
          .finally(() => setLoadPending(false))
        return
      }
      if (inventoryActionMode === 'closeCount') {
        setCloseCountPending(true)
        void postCloseCount({
          trip_id: validTripId,
          car_id: carId,
          items: items.map((item) => ({
            product_id: item.product_id,
            actual_quantity: item.quantity,
          })),
        })
          .then(() => {
            pushToast('success', 'Close count submitted.')
            setInventoryActionOpen(false)
            setInventoryActionMode(null)
          })
          .catch(reportError)
          .finally(() => setCloseCountPending(false))
      }
    },
    [selectedId, detailData, inventoryActionMode, pushToast, reportError],
  )

  const handleEndTrip = useCallback(
    (tripId?: string) => {
      const targetTripId = tripId ?? selectedId
      if (!targetTripId) return
      if (!window.confirm('Close this trip? Ensure closing inventory count was submitted.')) return
      void close
        .mutateAsync(targetTripId)
        .then(() => pushToast('success', 'Trip closed.'))
        .catch(reportError)
    },
    [selectedId, close, pushToast, reportError],
  )

  const handleDeleteTrip = useCallback(() => {
    if (!selectedId) return
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    void remove
      .mutateAsync(selectedId)
      .then(() => {
        pushToast('success', 'Trip deleted.')
        setSelectedId('')
      })
      .catch(reportError)
  }, [selectedId, remove, pushToast, reportError])

  const tripPending =
    closeCountPending || openingPending || loadPending || open.isPending || close.isPending || remove.isPending

  const closeCountProducts = useMemo(
    () =>
      (productsData?.items ?? []).map((product) => ({
        id: product.id,
        label: product.item || `Product #${product.id}`,
      })),
    [productsData],
  )

  const { data: createDriversRes, isError: createDriversError } = useQuery({
    queryKey: ['drivers', 'trip-create-options'],
    queryFn: () => listDrivers({ per_page: 500, sort: 'full_name', direction: 'asc' }),
  })
  const { data: createCarsRes, isError: createCarsError } = useQuery({
    queryKey: ['cars', 'trip-create-options'],
    queryFn: () => listCars({ per_page: 500, sort: 'id', direction: 'asc' }),
  })
  const { data: createZonesRes, isError: createZonesError } = useQuery({
    queryKey: ['zones', 'trip-create-options'],
    queryFn: () => listZones({ per_page: 500, sort: 'name', direction: 'asc' }),
  })

  const filterDriverOptions = useMemo(
    () =>
      (createDriversRes?.items ?? []).map((d) => ({
        id: d.id,
        label: d.full_name || `Driver #${d.id}`,
      })),
    [createDriversRes],
  )
  const filterVehicleOptions = useMemo(
    () =>
      (createCarsRes?.items ?? []).map((c) => ({
        id: c.id,
        label: `${c.model} (${c.plate_number})`,
      })),
    [createCarsRes],
  )
  const zoneOptions = useMemo(() => {
    const z = new Set<string>()
    for (const t of rawTrips) {
      if (t.zone && typeof t.zone === 'object' && 'name' in t.zone) {
        const n = String((t.zone as { name?: string }).name ?? '').trim()
        if (n) z.add(n)
      } else if (t.destination) {
        const n = String(t.destination).trim()
        if (n) z.add(n)
      }
    }
    return [...z].sort((a, b) => a.localeCompare(b))
  }, [rawTrips])

  const createDriverOptions = useMemo(
    () =>
      (createDriversRes?.items ?? []).map((driver) => ({
        id: driver.id,
        label: driver.full_name || `Driver #${driver.id}`,
      })),
    [createDriversRes],
  )
  const createCarOptions = useMemo(
    () =>
      (createCarsRes?.items ?? []).map((car) => ({
        id: car.id,
        label: `${car.model} (${car.plate_number})`,
      })),
    [createCarsRes],
  )
  const createZoneOptions = useMemo(
    () =>
      (createZonesRes?.items ?? []).map((zone) => ({
        id: zone.id,
        label: zone.name || `${zone.city} #${zone.id}`,
      })),
    [createZonesRes],
  )

  useEffect(() => {
    if (createDriversError || createCarsError || createZonesError) {
      pushToast('error', 'Could not load driver/car/zone options.')
    }
  }, [createDriversError, createCarsError, createZonesError, pushToast])

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
          setSelectedId(String(trip.id))
        })
        .catch(reportError)
    },
    [create, pushToast, reportError],
  )

  const mergedProductsById = useMemo(() => {
    const m = new Map(productsById)
    for (const p of productsData?.items ?? []) {
      m.set(p.id, p)
    }
    return m
  }, [productsById, productsData])

  const refreshAll = useCallback(() => {
    void tripsQuery.refetch()
    void salesQuery.refetch()
    if (canManageFleet) {
      void alertsQuery.refetch()
      void pendingRequestsQuery.refetch()
      void fleetSnapshotQuery.refetch()
    }
  }, [
    tripsQuery,
    salesQuery,
    alertsQuery,
    pendingRequestsQuery,
    fleetSnapshotQuery,
    canManageFleet,
  ])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('trip-ops-search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (tripsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1920px] space-y-4 p-1">
        <div className="grid gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <LoadingSkeleton key={i} className="min-h-[72px]" />
          ))}
        </div>
        <LoadingSkeleton className="min-h-[120px]" />
        <LoadingSkeleton className="min-h-[400px]" />
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
    <div className="mx-auto flex w-full max-w-[1920px] gap-0">
      <div className="min-w-0 flex-1 space-y-4 p-1 lg:pr-3">
        <TripOperationsKpiStrip
          cards={kpiCards}
          activeFilterKey={kpiFilterKey ?? undefined}
          onFilterCard={(key: string | null) => {
            if (!key) {
              setKpiFilterKey(null)
              return
            }
            setKpiFilterKey((prev) => (prev === key ? null : key))
          }}
        />

        <TripOperationsFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          zoneOptions={zoneOptions}
          driverOptions={user?.role === 'driver' ? [] : filterDriverOptions}
          vehicleOptions={user?.role === 'driver' ? [] : filterVehicleOptions}
          liveMode={liveMode}
          onLiveModeChange={setLiveMode}
          onRefresh={refreshAll}
          refreshing={tripsQuery.isFetching || salesQuery.isFetching}
          onExport={() => exportOperationsToCsv(filteredRows)}
          createTripAction={
            user?.role === 'admin' || user?.role === 'manager' ? (
              <Button type="button" size="sm" className="h-8 text-xs" onClick={() => setCreateModalOpen(true)}>
                <Plus className="size-3.5" aria-hidden />
                Create trip
              </Button>
            ) : null
          }
        />

        {user?.role === 'driver' && driverScopeId == null ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Your driver profile must match your user name to list trips. Ask an admin to align your account name with
            your driver record.
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            No trips match the current operational filters.
          </p>
        ) : (
          <TripOperationsTable
            data={filteredRows}
            globalFilter={filters.search}
            selectedId={selectedId || null}
            onSelectRow={selectTrip}
            pageSize={25}
            bulkActions={
              <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={refreshAll}>
                Sync now
              </Button>
            }
          />
        )}
      </div>

      <div className="hidden lg:block">
        <TripOperationDrawer
          open
          layout="desktop"
          tripId={selectedId || null}
          detailLoading={Boolean(selectedId) && detailLoading}
          detail={detailData ?? null}
          workspace={workspaceDetail}
          productsById={mergedProductsById}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setSelectedId('')}
          canManageRequests={canManageFleet}
          onInventoryError={(msg: string) => pushToast('error', msg)}
          onOpening={canOperateInventory ? () => handleInventoryActionOpen('opening') : undefined}
          onLoad={canOperateInventory ? () => handleInventoryActionOpen('load') : undefined}
          onCloseCount={canOperateInventory ? () => handleInventoryActionOpen('closeCount') : undefined}
          onEndTrip={canOperateInventory ? () => handleEndTrip(selectedId) : undefined}
          onDeleteTrip={canManageFleet ? handleDeleteTrip : undefined}
          tripActionPending={tripPending}
        />
      </div>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity lg:hidden',
          mobilePanelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!mobilePanelOpen}
        onClick={() => setMobilePanelOpen(false)}
      />

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-full transform border-l border-border/60 bg-background shadow-2xl transition-transform duration-200 ease-out sm:max-w-[540px] lg:hidden',
          mobilePanelOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Trip operations"
      >
        <TripOperationDrawer
          open={mobilePanelOpen}
          layout="drawer"
          tripId={selectedId || null}
          detailLoading={Boolean(selectedId) && detailLoading}
          detail={detailData ?? null}
          workspace={workspaceDetail}
          productsById={mergedProductsById}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setMobilePanelOpen(false)}
          canManageRequests={canManageFleet}
          onInventoryError={(msg: string) => pushToast('error', msg)}
          onOpening={canOperateInventory ? () => handleInventoryActionOpen('opening') : undefined}
          onLoad={canOperateInventory ? () => handleInventoryActionOpen('load') : undefined}
          onCloseCount={canOperateInventory ? () => handleInventoryActionOpen('closeCount') : undefined}
          onEndTrip={canOperateInventory ? () => handleEndTrip(selectedId) : undefined}
          onDeleteTrip={canManageFleet ? handleDeleteTrip : undefined}
          tripActionPending={tripPending}
        />
      </div>

      <CreateTripModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        submitting={create.isPending}
        driverOptions={createDriverOptions}
        carOptions={createCarOptions}
        zoneOptions={createZoneOptions}
        onSubmit={handleCreateTrip}
      />

      <InventoryActionModal
        open={inventoryActionOpen}
        mode={inventoryActionMode}
        onClose={() => {
          setInventoryActionOpen(false)
          setInventoryActionMode(null)
        }}
        submitting={tripPending}
        products={closeCountProducts}
        onSubmit={handleInventoryActionSubmit}
      />
    </div>
  )
}
