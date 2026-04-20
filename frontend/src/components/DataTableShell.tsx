import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DataTableShellProps {
  children: ReactNode
  className?: string
}

/**
 * Rounded bordered table wrapper matching operational list tables in design references.
 */
export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 shadow-sm dark:border-border/40',
        className,
      )}
    >
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}

interface DataTableHeadProps {
  children: ReactNode
}

export function DataTableHead({ children }: DataTableHeadProps) {
  return (
    <thead className="bg-surface-high text-muted-foreground">{children}</thead>
  )
}

interface DataTableBodyProps {
  children: ReactNode
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return <tbody className="divide-y divide-border/60 bg-card">{children}</tbody>
}
