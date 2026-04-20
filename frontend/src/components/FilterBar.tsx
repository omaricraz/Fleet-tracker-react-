import type { ChangeEvent, ReactNode } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  searchPlaceholder?: string
  /** When set with `onSearchChange`, search is editable (not read-only). */
  searchValue?: string
  onSearchChange?: (event: ChangeEvent<HTMLInputElement>) => void
  searchAriaLabel?: string
  searchDisabled?: boolean
  /** Applied to the search field wrapper (e.g. `flex-1 max-w-none` for full-width search). */
  searchContainerClassName?: string
  filters?: ReactNode
  actions?: ReactNode
  className?: string
}

export function FilterBar({
  searchPlaceholder = 'Search modules',
  searchValue,
  onSearchChange,
  searchAriaLabel = 'Search modules',
  searchDisabled,
  searchContainerClassName,
  filters,
  actions,
  className,
}: FilterBarProps) {
  const controlled = onSearchChange !== undefined
  return (
    <div
      className={cn(
        'surface-panel flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div
          className={cn('relative w-full max-w-md', searchContainerClassName)}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={searchAriaLabel}
            className="pl-10"
            placeholder={searchPlaceholder}
            readOnly={!controlled}
            value={controlled ? (searchValue ?? '') : undefined}
            onChange={onSearchChange}
            disabled={searchDisabled}
          />
        </div>
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
