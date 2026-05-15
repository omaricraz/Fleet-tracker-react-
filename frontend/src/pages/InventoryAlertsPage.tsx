import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { INVENTORY_ALERTS_PAGE_PATH } from '@/features/inventory-alerts/constants'
import { useInventoryAlertsPageQuery } from '@/features/inventory-alerts/useInventoryAlertsPageQuery'
import { useAuth } from '@/features/auth/AuthContext'
import { canAccessPath, getHomePath } from '@/features/auth/permissions'
import { PaginationBar } from '@/features/resource-management/components/PaginationBar'
import type { InventoryAlertItem } from '@/services/api/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

function alertBadgeVariant(kind: string): 'destructive' | 'warning' | 'secondary' {
  if (kind === 'zero_stock') return 'destructive'
  if (kind === 'low_stock') return 'warning'
  return 'secondary'
}

function formatWhen(a: InventoryAlertItem): string {
  if (!a.created_at) return '—'
  const d = new Date(a.created_at)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export function InventoryAlertsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)

  const allowed = Boolean(user && canAccessPath(user, INVENTORY_ALERTS_PAGE_PATH))
  const feed = useInventoryAlertsPageQuery(page, PAGE_SIZE, allowed)

  const meta = feed.data?.meta
  const total = meta?.total ?? 0
  const totalPages = meta?.last_page ?? 1
  const safePage = Math.min(page, Math.max(1, totalPages))
  const pageRows = feed.data?.items ?? []

  useEffect(() => {
    if (feed.data?.meta?.last_page && page > feed.data.meta.last_page) {
      setPage(feed.data.meta.last_page)
    }
  }, [feed.data?.meta?.last_page, page])

  if (!user) return null
  if (!allowed) {
    return <Navigate to={getHomePath(user)} replace />
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Operations"
        title="Inventory alerts"
        description="Paged list from GET /inventory/alerts (query: page, per_page). Uses Laravel-style items + meta when present; legacy bucket payloads are flattened and sliced by page locally."
        actions={
          <Button type="button" variant="secondary" size="sm" disabled={feed.isFetching} onClick={() => void feed.refetch()}>
            {feed.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <section className="surface-panel overflow-hidden rounded-xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border/60 bg-surface-high/20 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-black tracking-tight text-primary">Alerts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Columns match inventory alert rows: vehicle, product, and normalized quantity from the tenant ledger.
          </p>
        </div>

        <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-surface-high/30">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">#</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Alert type
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Vehicle
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Product
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Quantity
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Recorded at
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {feed.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </td>
                </tr>
              ) : feed.isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-destructive">
                    Could not load alerts.
                  </td>
                </tr>
              ) : total === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                    No alerts right now.
                  </td>
                </tr>
              ) : (
                pageRows.map((a, idx) => {
                  const per = meta?.per_page ?? PAGE_SIZE
                  const current = meta?.current_page ?? safePage
                  const rowNum = (current - 1) * per + idx + 1
                  return (
                    <tr
                      key={a.id}
                      className={cn(
                        'transition-colors',
                        'hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15',
                      )}
                    >
                      <td className="px-6 py-4 text-sm font-semibold tabular-nums text-foreground">{rowNum}</td>
                      <td className="px-6 py-4">
                        <Badge variant={alertBadgeVariant(a.kind)} className="text-[10px]">
                          {a.title}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground">{a.car_name ?? '—'}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">Car ID {a.car_id ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">{a.product_name ?? '—'}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">Product ID {a.product_id ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm tabular-nums font-semibold text-foreground">{a.quantity ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatWhen(a)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!feed.isLoading && !feed.isError && total > 0 ? (
          <PaginationBar
            page={safePage}
            pageSize={meta?.per_page ?? PAGE_SIZE}
            total={total}
            entityLabel="alerts"
            onPageChange={(p) => setPage(p)}
          />
        ) : null}
      </section>
    </div>
  )
}
