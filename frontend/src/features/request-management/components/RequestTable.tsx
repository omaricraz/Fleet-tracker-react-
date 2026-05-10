import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Fuel,
  Wrench,
} from 'lucide-react'

import { DataTableBody, DataTableHead, DataTableShell } from '@/components/DataTableShell'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

import { formatRequestCreatedAt, formatRequestedSummary } from '../lib/formatters'
import type { FleetRequest, RequestStatus } from '../types'

function statusTone(status: RequestStatus): 'warning' | 'success' | 'danger' {
  if (status === 'pending') return 'warning'
  if (status === 'approved') return 'success'
  return 'danger'
}

function statusLabel(status: RequestStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function TypeBadge({ type }: { type: FleetRequest['type'] }) {
  const config = {
    fuel: { icon: Fuel, label: 'Fuel' },
    maintenance: { icon: Wrench, label: 'Maintenance' },
  }[type]
  const Icon = config.icon
  return (
    <Badge variant="outline" className="gap-1.5 normal-case tracking-normal">
      <Icon className="size-3.5" aria-hidden />
      {config.label}
    </Badge>
  )
}

interface RequestTableProps {
  items: FleetRequest[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onView: (request: FleetRequest) => void
  onApprove: (request: FleetRequest) => void
  onReject: (request: FleetRequest) => void
  decisionDisabled?: boolean
  /** Tenant managers/admins only — drivers can view but not approve. */
  allowDecisions?: boolean
}

export function RequestTable({
  items,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onApprove,
  onReject,
  decisionDisabled,
  allowDecisions = true,
}: RequestTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  if (loading) {
    return <LoadingSkeleton className="min-h-[320px] w-full rounded-xl" />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm dark:border-border/40">
      <div className="overflow-x-auto">
        <DataTableShell className="rounded-none border-0 shadow-none">
          <DataTableHead>
            <tr className="text-[10px] font-bold uppercase tracking-widest">
              <th className="px-4 py-3.5 font-bold sm:px-6">Request ID</th>
              <th className="px-4 py-3.5 font-bold sm:px-6">Type</th>
              <th className="px-4 py-3.5 font-bold sm:px-6">Driver</th>
              <th className="px-4 py-3.5 font-bold sm:px-6">Status</th>
              <th className="px-4 py-3.5 font-bold sm:px-6">Requested</th>
              <th className="hidden px-4 py-3.5 font-bold md:table-cell lg:px-6">Notes</th>
              <th className="px-4 py-3.5 font-bold sm:px-6">Created</th>
              <th className="px-4 py-3.5 text-right font-bold sm:px-6">Actions</th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-sm text-muted-foreground">
                  No requests match the current filters.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-primary-fixed/15 dark:hover:bg-primary-fixed/10"
                >
                  <td className="px-4 py-3.5 font-bold text-primary sm:px-6">#{r.display_id}</td>
                  <td className="px-4 py-3.5 sm:px-6">
                    <TypeBadge type={r.type} />
                  </td>
                  <td className="px-4 py-3.5 sm:px-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">{r.driver.name}</span>
                      {r.driver.vehicle_label ? (
                        <span className="text-xs text-muted-foreground">
                          {r.driver.vehicle_label}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 sm:px-6">
                    <StatusBadge label={statusLabel(r.status)} tone={statusTone(r.status)} />
                  </td>
                  <td className="max-w-[200px] px-4 py-3.5 text-sm font-semibold sm:px-6">
                    <span className="line-clamp-2">{formatRequestedSummary(r)}</span>
                  </td>
                  <td className="hidden max-w-[240px] px-4 py-3.5 text-sm text-muted-foreground md:table-cell lg:px-6">
                    <span className="line-clamp-2" title={r.notes ?? undefined}>
                      {r.notes?.trim() ? r.notes : '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground sm:px-6">
                    {formatRequestCreatedAt(r.created_at)}
                  </td>
                  <td className="px-4 py-3.5 sm:px-6">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => onView(r)}
                        aria-label={`View ${r.display_id}`}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        disabled={r.status !== 'pending' || decisionDisabled || !allowDecisions}
                        onClick={() => onApprove(r)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs text-destructive ring-destructive/25 hover:bg-destructive/10"
                        disabled={r.status !== 'pending' || decisionDisabled || !allowDecisions}
                        onClick={() => onReject(r)}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTableBody>
        </DataTableShell>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[11px] font-bold text-muted-foreground">
          {total === 0 ? 'No requests' : `Showing ${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8"
            disabled={safePage <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[4.5rem] px-2 text-center text-xs font-bold text-foreground">
            {safePage} / {totalPages}
          </span>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
