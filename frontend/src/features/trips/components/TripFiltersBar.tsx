import { Calendar, ChevronDown, Filter, User } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const FALLBACK_ZONES = ['Filter by Zone', 'Hargeisa East', 'Berbera Port', 'Burao South'] as const
const FALLBACK_DRIVERS = [
  'Filter by Driver',
  'Ali Hassan',
  'Mohamed Abdi',
  'Ismail Farah',
  'Omar Duale',
] as const

export interface TripFiltersBarProps {
  dateRangeLabel: string
  zone: string
  onZoneChange: (zone: string) => void
  driver: string
  onDriverChange: (driver: string) => void
  search: string
  onSearchChange: (value: string) => void
  /** When provided (e.g. from live trip list), replaces static zone options. */
  zoneOptions?: string[]
  driverOptions?: string[]
  className?: string
  actions?: ReactNode
}

export function TripFiltersBar({
  dateRangeLabel,
  zone,
  onZoneChange,
  driver,
  onDriverChange,
  search,
  onSearchChange,
  zoneOptions,
  driverOptions,
  className,
  actions,
}: TripFiltersBarProps) {
  const zones = zoneOptions?.length
    ? ['Filter by Zone', ...zoneOptions]
    : [...FALLBACK_ZONES]
  const drivers = driverOptions?.length
    ? ['Filter by Driver', ...driverOptions]
    : [...FALLBACK_DRIVERS]
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold tracking-tight text-primary">Trips</h2>
        {actions}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="sr-only" htmlFor="trip-workspace-search">
          Search trips
        </label>
        <input
          id="trip-workspace-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search trips, zones, drivers…"
          className="min-w-[200px] rounded-md border border-[var(--outline-variant)]/30 bg-white px-3 py-2 text-xs font-medium text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 sm:max-w-[220px]"
        />
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-[var(--outline-variant)]/30 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-muted/40"
        >
          <Calendar className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-tight text-muted-foreground">
            {dateRangeLabel}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground/80" aria-hidden />
        </button>
        <div className="relative min-w-[160px]">
          <Filter className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={zone}
            onChange={(e) => onZoneChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-md border border-[var(--outline-variant)]/30 bg-white py-2 pl-9 pr-9 text-xs font-bold uppercase tracking-tight text-muted-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/80" />
        </div>
        <div className="relative min-w-[168px]">
          <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={driver}
            onChange={(e) => onDriverChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-md border border-[var(--outline-variant)]/30 bg-white py-2 pl-9 pr-9 text-xs font-bold uppercase tracking-tight text-muted-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {drivers.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/80" />
        </div>
      </div>
    </div>
  )
}
