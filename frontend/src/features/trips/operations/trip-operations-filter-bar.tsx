import { CalendarDays, Download, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { FilterBar } from '@/components/FilterBar'
import { Button } from '@/components/ui/button'
import type { TripOperationsFilters } from '@/features/trips/operations/types'

const selectClass =
  'rounded-xl border-0 bg-muted py-2.5 pl-3 pr-8 text-xs font-bold text-foreground ring-1 ring-transparent focus:ring-2 focus:ring-primary/20 disabled:opacity-60'

export interface TripOperationsFilterBarProps {
  filters: TripOperationsFilters
  onFiltersChange: (next: TripOperationsFilters) => void
  zoneOptions: string[]
  driverOptions: Array<{ id: number; label: string }>
  vehicleOptions: Array<{ id: number; label: string }>
  liveMode: boolean
  onLiveModeChange: (value: boolean) => void
  onRefresh: () => void
  refreshing: boolean
  onExport: () => void
  createTripAction?: ReactNode
}

export function TripOperationsFilterBar({
  filters,
  onFiltersChange,
  zoneOptions,
  driverOptions,
  vehicleOptions,
  liveMode,
  onLiveModeChange,
  onRefresh,
  refreshing,
  onExport,
  createTripAction,
}: TripOperationsFilterBarProps) {
  const patch = (partial: Partial<TripOperationsFilters>) => onFiltersChange({ ...filters, ...partial })

  return (
    <FilterBar
      searchPlaceholder="Search trips, drivers, zones…"
      searchValue={filters.search}
      onSearchChange={(e) => patch({ search: e.target.value })}
      searchInputId="trip-ops-search"
      searchAriaLabel="Search trip operations"
      searchContainerClassName="max-w-md md:max-w-lg"
      filters={
        <>
          <div className="flex items-center gap-2 rounded-lg bg-muted/80 px-2 py-1 ring-1 ring-border/50">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <label htmlFor="trip-ops-date-from" className="sr-only">
              Sales from
            </label>
            <input
              id="trip-ops-date-from"
              type="date"
              className={selectClass}
              value={filters.dateFrom}
              onChange={(e) => patch({ dateFrom: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">–</span>
            <label htmlFor="trip-ops-date-to" className="sr-only">
              Sales to
            </label>
            <input
              id="trip-ops-date-to"
              type="date"
              className={selectClass}
              value={filters.dateTo}
              onChange={(e) => patch({ dateTo: e.target.value })}
            />
          </div>

          <label htmlFor="trip-ops-zone" className="sr-only">
            Zone
          </label>
          <select
            id="trip-ops-zone"
            className={selectClass}
            value={filters.zone}
            onChange={(e) => patch({ zone: e.target.value })}
          >
            <option value="">All zones</option>
            {zoneOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          {driverOptions.length > 0 ? (
            <>
              <label htmlFor="trip-ops-driver" className="sr-only">
                Driver
              </label>
              <select
                id="trip-ops-driver"
                className={selectClass}
                value={filters.driverId}
                onChange={(e) => patch({ driverId: e.target.value })}
              >
                <option value="">All drivers</option>
                {driverOptions.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {vehicleOptions.length > 0 ? (
            <>
              <label htmlFor="trip-ops-vehicle" className="sr-only">
                Vehicle
              </label>
              <select
                id="trip-ops-vehicle"
                className={selectClass}
                value={filters.vehicleId}
                onChange={(e) => patch({ vehicleId: e.target.value })}
              >
                <option value="">All vehicles</option>
                {vehicleOptions.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <label htmlFor="trip-ops-status" className="sr-only">
            Trip status
          </label>
          <select
            id="trip-ops-status"
            className={selectClass}
            value={filters.tripStatus}
            onChange={(e) => patch({ tripStatus: e.target.value as TripOperationsFilters['tripStatus'] })}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-muted/80 px-3 py-2 text-xs font-bold ring-1 ring-border/50">
            <input
              type="checkbox"
              className="size-3.5 rounded border-border"
              checked={liveMode}
              onChange={(e) => onLiveModeChange(e.target.checked)}
            />
            Live
          </label>
        </>
      }
      actions={
        <>
          {createTripAction}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            disabled={refreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={onExport}>
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
        </>
      }
    />
  )
}
