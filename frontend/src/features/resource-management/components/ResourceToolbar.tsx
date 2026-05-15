import { Search, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ResourceView } from '../types'

const searchPlaceholder: Record<ResourceView, string> = {
  drivers: 'Search drivers by name, phone, ID, or user ID...',
  products: 'Search products by name, type, or SKU...',
  zones: 'Search zones by name or city...',
  customers: 'Search customers by name, phone, or location...',
}

const addLabel: Record<ResourceView, string> = {
  drivers: 'Add Driver',
  products: 'Add Product',
  zones: 'Add Zone',
  customers: 'Add Customer',
}

interface ResourceToolbarProps {
  view: ResourceView
  search: string
  onSearchChange: (value: string) => void
  zoneFilter: string
  onZoneFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  zoneOptions: string[]
  statusOptions: string[]
  onAddClick: () => void
}

export function ResourceToolbar({
  view,
  search,
  onSearchChange,
  zoneFilter,
  onZoneFilterChange,
  statusFilter,
  onStatusFilterChange,
  zoneOptions,
  statusOptions,
  onAddClick,
}: ResourceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border/60 p-6">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 lg:max-w-4xl">
        <div
          className={cn(
            'flex min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-muted px-4 py-2.5 ring-1 ring-transparent transition focus-within:bg-card focus-within:ring-primary/35',
          )}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder[view]}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            type="search"
            aria-label="Search"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="zone-filter">
            Zone filter
          </label>
          <select
            id="zone-filter"
            value={zoneFilter}
            onChange={(e) => onZoneFilterChange(e.target.value)}
            className="rounded-xl border-0 bg-muted py-2.5 pl-4 pr-10 text-sm font-bold text-foreground ring-1 ring-transparent focus:ring-2 focus:ring-primary/20"
          >
            {zoneOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="status-filter">
            Status filter
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-xl border-0 bg-muted py-2.5 pl-4 pr-10 text-sm font-bold text-foreground ring-1 ring-transparent focus:ring-2 focus:ring-primary/20"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          className="rounded-xl px-5 py-2.5 font-bold shadow-lg shadow-primary/10"
          onClick={onAddClick}
        >
          <UserPlus className="size-5" aria-hidden />
          {addLabel[view]}
        </Button>
      </div>
    </div>
  )
}
