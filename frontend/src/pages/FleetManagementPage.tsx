import { ArrowDownUp, Filter, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/KpiCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { AddVehicleMenu } from '@/features/fleet/components/AddVehicleMenu'
import { FleetLoadMoreSection } from '@/features/fleet/components/FleetLoadMoreSection'
import { FleetVehicleCard } from '@/features/fleet/components/FleetVehicleCard'
import { filterFleetVehicles } from '@/features/fleet/filterFleet'
import { fleetKpis, mockFleetVehicles } from '@/features/fleet/mockFleetData'
import type {
  CapacityFilter,
  FleetDetailTab,
  StatusFilter,
} from '@/features/fleet/types'
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

export function FleetManagementPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>('v1')
  const [detailTab, setDetailTab] = useState<FleetDetailTab>('fuel')
  const [driverOverrides, setDriverOverrides] = useState<Record<string, string>>({})
  const [showAll, setShowAll] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 380)
    return () => window.clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      filterFleetVehicles(
        mockFleetVehicles,
        search,
        statusFilter,
        capacityFilter,
        driverOverrides,
      ),
    [search, statusFilter, capacityFilter, driverOverrides],
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

  if (loading) {
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

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">
      <PageHeader
        title="Fleet Management"
        description="Manage vehicles and historical operational data"
        actions={<AddVehicleMenu />}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total vehicles"
          value={String(fleetKpis.totalVehicles)}
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
    </div>
  )
}
