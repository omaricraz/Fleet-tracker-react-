import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
  className?: string
}

export function FilterBar({
  searchPlaceholder = 'Search modules',
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'surface-panel flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search modules"
            className="pl-10"
            placeholder={searchPlaceholder}
            readOnly
          />
        </div>
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
