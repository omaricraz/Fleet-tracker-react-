import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { DataTableBody, DataTableHead, DataTableShell } from '@/components/DataTableShell'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import type { TripOperationRow } from '@/features/trips/lib/tripOperationsData'
import { cn } from '@/lib/utils'

function statusTone(status: TripOperationRow['status']): 'success' | 'neutral' | 'warning' {
  if (status === 'completed') return 'neutral'
  if (status === 'delayed') return 'warning'
  return 'success'
}

export interface TripOperationsTableProps {
  data: TripOperationRow[]
  globalFilter: string
  selectedId: string | null
  onSelectRow: (id: string) => void
  pageSize: number
  bulkActions?: ReactNode
}

export function TripOperationsTable({
  data,
  globalFilter,
  selectedId,
  onSelectRow,
  pageSize,
  bulkActions,
}: TripOperationsTableProps) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [globalFilter, data])

  const needle = globalFilter.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!needle) return data
    return data.filter((row) => {
      const blob = [row.displayId, row.zone, row.driverName, row.vehicleLabel, row.status].join(' ').toLowerCase()
      return blob.includes(needle)
    })
  }, [data, needle])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, filtered.length)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-3">
      {bulkActions ? (
        <div className="surface-panel flex flex-wrap justify-end gap-2 rounded-xl p-3">{bulkActions}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm dark:border-border/40">
        <div className="overflow-x-auto">
          <DataTableShell className="rounded-none border-0 shadow-none">
            <DataTableHead>
              <tr className="text-[10px] font-bold uppercase tracking-widest">
                <th className="px-4 py-3.5 font-bold sm:px-6">Trip</th>
                <th className="px-4 py-3.5 font-bold sm:px-6">Status</th>
                <th className="px-4 py-3.5 font-bold sm:px-6">Zone</th>
                <th className="px-4 py-3.5 font-bold sm:px-6">Driver</th>
                <th className="hidden px-4 py-3.5 font-bold md:table-cell lg:px-6">Vehicle</th>
                <th className="px-4 py-3.5 text-right font-bold sm:px-6">Revenue</th>
                <th className="hidden px-4 py-3.5 text-right font-bold lg:table-cell lg:px-6">Pending</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No rows match the table filter.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const selected = selectedId === row.id
                  return (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectRow(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectRow(row.id)
                        }
                      }}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selected
                          ? 'bg-primary/10 hover:bg-primary/15'
                          : 'hover:bg-primary-fixed/15 dark:hover:bg-primary-fixed/10',
                      )}
                    >
                      <td className="px-4 py-3.5 font-bold text-primary sm:px-6">{row.displayId}</td>
                      <td className="px-4 py-3.5 sm:px-6">
                        <StatusBadge label={row.status} tone={statusTone(row.status)} />
                      </td>
                      <td className="px-4 py-3.5 text-sm sm:px-6">{row.zone}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold sm:px-6">{row.driverName}</td>
                      <td className="hidden px-4 py-3.5 text-sm text-muted-foreground md:table-cell lg:px-6">
                        {row.vehicleLabel}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-bold sm:px-6">
                        ${row.revenue.toFixed(2)}
                      </td>
                      <td className="hidden px-4 py-3.5 text-right text-sm lg:table-cell lg:px-6">
                        {row.pendingRequests}
                        {row.hasAlert ? (
                          <span className="ml-2 text-[10px] font-bold uppercase text-destructive">Alert</span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </DataTableBody>
          </DataTableShell>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/50 px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0 ? '0' : `${from}–${to}`} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage <= 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-xs font-semibold text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={safePage >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
