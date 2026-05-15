import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ClipboardList,
  Layers,
  LayoutGrid,
  Package,
  Route,
  ShoppingCart,
  Truck,
  UserCircle2,
  Users,
} from 'lucide-react'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { ApiError, fetchDashboardSummary } from '@/services/api'

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

function formatDecimalString(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n)
}

function formatAsOf(iso: string, timeZone: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timeZone || undefined,
  }).format(d)
}

function titleCaseStatus(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function StatusBreakdown({ entries }: { entries: [string, number][] }) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No items in this period.</p>
  }
  return (
    <ul className="space-y-2">
      {entries.map(([status, count]) => (
        <li
          key={status}
          className="flex items-center justify-between gap-3 rounded-lg bg-surface-low/80 px-3 py-2 text-sm"
        >
          <span className="font-medium text-secondary">{titleCaseStatus(status)}</span>
          <span className="font-black tabular-nums text-primary">{formatNumber(count)}</span>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 60_000,
  })

  const data = summaryQuery.data
  const tripStatusEntries = data ? Object.entries(data.trips.by_status).sort((a, b) => b[1] - a[1]) : []
  const requestStatusEntries = data
    ? Object.entries(data.requests.by_status).sort((a, b) => b[1] - a[1])
    : []

  const headerStats = data
    ? {
        tenantName: 'Operations overview',
        tenantStatusLabel: `As of ${formatAsOf(data.as_of, data.timezone)}`,
        heroSubtitle: `Dashboard figures use the tenant timezone ${data.timezone}. Counts and rollups refresh with each load.`,
      }
    : {
        tenantName: 'Operations overview',
        tenantStatusLabel: 'Loading summary…',
        heroSubtitle: 'Fetching live tenant metrics from the server.',
      }

  return (
    <div className="w-full">
      <DashboardHeader stats={headerStats} />

      {summaryQuery.isLoading ? (
        <LoadingSkeleton className="min-h-[420px] w-full rounded-xl" />
      ) : summaryQuery.isError ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {summaryQuery.error instanceof ApiError
            ? summaryQuery.error.message
            : 'Could not load dashboard summary.'}
        </div>
      ) : data ? (
        <>
          <section className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard title="Users" icon={Layers} accent="muted">
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary">
                {formatNumber(data.counts.tenant_users)}
              </p>
            </MetricCard>
            <MetricCard title="Vehicles" icon={Truck} accent="primary-dim">
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary">
                {formatNumber(data.counts.cars)}
              </p>
            </MetricCard>
            <MetricCard title="Drivers" icon={UserCircle2} accent="muted">
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary">
                {formatNumber(data.counts.drivers)}
              </p>
            </MetricCard>
            <MetricCard title="Customers" icon={Users} accent="muted">
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary">
                {formatNumber(data.counts.customers)}
              </p>
            </MetricCard>
            <MetricCard title="Products" icon={Package} accent="tertiary-dim">
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary">
                {formatNumber(data.counts.products)}
              </p>
            </MetricCard>
              <MetricCard title="Zones" icon={LayoutGrid} accent="muted" className="xl:col-span-1">
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary">
                {formatNumber(data.counts.zones)}
              </p>
            </MetricCard>
          </section>

          <section className="relative z-10 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/40 bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(11,28,48,0.02)]">
              <div className="mb-6 flex items-center gap-2">
                <ShoppingCart className="size-5 text-muted-foreground" aria-hidden />
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sales
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-low/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Today
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums text-primary">
                    ${formatDecimalString(data.sales.today.revenue_sum)}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {formatNumber(data.sales.today.sale_count)} sales ·{' '}
                    {formatDecimalString(data.sales.today.quantity_sum)} qty
                  </p>
                </div>
                <div className="rounded-lg bg-surface-low/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Last 7 days
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums text-primary">
                    ${formatDecimalString(data.sales.rolling_7_days.revenue_sum)}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {formatNumber(data.sales.rolling_7_days.sale_count)} sales ·{' '}
                    {formatDecimalString(data.sales.rolling_7_days.quantity_sum)} qty
                  </p>
                </div>
              </div>
            </div>

            <MetricCard title="Trips" icon={Route} accent="muted">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Active in progress</p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-primary">
                    {formatNumber(data.trips.active_in_progress)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Completed (7 days)</p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-primary">
                    {formatNumber(data.trips.completed_last_7_days)}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-outline-variant/30 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  By status
                </p>
                <StatusBreakdown entries={tripStatusEntries} />
              </div>
            </MetricCard>
          </section>

          <section className="relative z-10 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MetricCard title="Requests" icon={ClipboardList} accent="primary-dim">
              <StatusBreakdown entries={requestStatusEntries} />
            </MetricCard>

            <MetricCard
              title="Inventory alerts"
              icon={AlertTriangle}
              accent="error"
              trailing={
                <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />
              }
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                <li className="flex flex-col rounded-lg bg-surface-low/80 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Low stock lines</span>
                  <span className="text-xl font-black tabular-nums text-primary">
                    {formatNumber(data.inventory_alerts.low_stock_car_product_lines)}
                  </span>
                </li>
                <li className="flex flex-col rounded-lg bg-surface-low/80 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Zero stock lines</span>
                  <span className="text-xl font-black tabular-nums text-primary">
                    {formatNumber(data.inventory_alerts.zero_stock_car_product_lines)}
                  </span>
                </li>
                <li className="flex flex-col rounded-lg bg-surface-low/80 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Negative closing variance</span>
                  <span className="text-xl font-black tabular-nums text-primary">
                    {formatNumber(data.inventory_alerts.negative_closing_variance_rows)}
                  </span>
                </li>
                <li className="flex flex-col rounded-lg bg-surface-low/80 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Repeated shortage patterns</span>
                  <span className="text-xl font-black tabular-nums text-primary">
                    {formatNumber(data.inventory_alerts.repeated_shortage_patterns)}
                  </span>
                </li>
              </ul>
            </MetricCard>
          </section>
        </>
      ) : null}
    </div>
  )
}
