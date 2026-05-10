import { CalendarDays } from 'lucide-react'

import { FilterBar } from '@/components/FilterBar'

import type { DateRangePreset, RequestStatus, RequestType } from '../types'

interface RequestFiltersBarProps {
  search: string
  onSearchChange: (value: string) => void
  type: RequestType | 'all'
  onTypeChange: (value: RequestType | 'all') => void
  status: RequestStatus | 'all'
  onStatusChange: (value: RequestStatus | 'all') => void
  driverId: string | 'all'
  onDriverChange: (value: string | 'all') => void
  drivers: Array<{ id: string; name: string }>
  datePreset: DateRangePreset
  onDatePresetChange: (value: DateRangePreset) => void
  disabled?: boolean
}

const dateLabels: Record<DateRangePreset, string> = {
  all: 'All dates',
  today: 'Today',
  last_7: 'Last 7 days',
  last_30: 'Last 30 days',
}

const selectClass =
  'rounded-xl border-0 bg-muted py-2.5 pl-3 pr-8 text-xs font-bold text-foreground ring-1 ring-transparent focus:ring-2 focus:ring-primary/20 disabled:opacity-60'

export function RequestFiltersBar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  driverId,
  onDriverChange,
  drivers,
  datePreset,
  onDatePresetChange,
  disabled,
}: RequestFiltersBarProps) {
  return (
    <FilterBar
      searchPlaceholder="Search by ID, driver, or notes…"
      searchValue={search}
      onSearchChange={(e) => onSearchChange(e.target.value)}
      searchAriaLabel="Search requests"
      searchDisabled={disabled}
      searchContainerClassName="max-w-md md:max-w-lg"
      filters={
        <>
          <div className="flex items-center gap-2 rounded-lg bg-muted/80 px-2 py-1 ring-1 ring-border/50">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
            <label htmlFor="req-date-preset" className="sr-only">
              Date range
            </label>
            <select
              id="req-date-preset"
              className={selectClass}
              value={datePreset}
              disabled={disabled}
              onChange={(e) => onDatePresetChange(e.target.value as DateRangePreset)}
            >
              {(Object.keys(dateLabels) as DateRangePreset[]).map((k) => (
                <option key={k} value={k}>
                  {dateLabels[k]}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="req-type" className="sr-only">
            Request type
          </label>
          <select
            id="req-type"
            className={selectClass}
            value={type}
            disabled={disabled}
            onChange={(e) => onTypeChange(e.target.value as RequestType | 'all')}
          >
            <option value="all">All types</option>
            <option value="fuel">Fuel</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <label htmlFor="req-status" className="sr-only">
            Status
          </label>
          <select
            id="req-status"
            className={selectClass}
            value={status}
            disabled={disabled}
            onChange={(e) => onStatusChange(e.target.value as RequestStatus | 'all')}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <label htmlFor="req-driver" className="sr-only">
            Driver
          </label>
          <select
            id="req-driver"
            className={selectClass}
            value={driverId}
            disabled={disabled}
            onChange={(e) => onDriverChange(e.target.value === 'all' ? 'all' : e.target.value)}
          >
            <option value="all">All drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </>
      }
    />
  )
}
