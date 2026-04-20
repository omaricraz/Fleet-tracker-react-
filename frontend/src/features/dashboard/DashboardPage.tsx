import { ArrowUp, Fuel, Route } from 'lucide-react'

import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { HeroMetricCard } from '@/features/dashboard/components/HeroMetricCard'
import { MaintenanceCard } from '@/features/dashboard/components/MaintenanceCard'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { RecentSalesCard } from '@/features/dashboard/components/RecentSalesCard'
import { RevenueChartCard } from '@/features/dashboard/components/RevenueChartCard'
import { ZoneChartCard } from '@/features/dashboard/components/ZoneChartCard'
import { dashboardStats, recentSalesMock } from '@/features/dashboard/data/dashboardStats'

export function DashboardPage() {
  const stats = dashboardStats
  const fleetPct = Math.round((stats.carsAvailable.available / stats.carsAvailable.total) * 100)

  return (
    <div className="w-full">
      <DashboardHeader stats={stats} />

      <section className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard sales={stats.salesToday} />

        <MetricCard title="Active Trips" icon={Route} accent="muted">
          <p className="text-4xl font-black tracking-tight text-primary">{stats.activeTrips.count}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.activeTrips.pendingAssignment} pending assignment
          </p>
        </MetricCard>

        <MetricCard title="Fuel Cost (WTD)" icon={Fuel} accent="tertiary-dim">
          <p className="text-4xl font-black tracking-tight text-primary">
            {stats.fuelCostWtd.amountFormatted}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <ArrowUp className="size-3.5" aria-hidden />
            {stats.fuelCostWtd.vsLastWeekPercent} vs last week
          </p>
        </MetricCard>

        <MetricCard title="Cars Available" accent="primary-dim">
          <div className="flex items-end justify-between gap-2">
            <p className="text-4xl font-black tracking-tight text-primary">
              {stats.carsAvailable.available}
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              / {stats.carsAvailable.total} Total
            </p>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${fleetPct}%` }}
            />
          </div>
        </MetricCard>

        <MetricCard
          title="Low Stock Alerts"
          accent="error"
          trailing={<span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />}
        >
          <p className="text-4xl font-black tracking-tight text-primary">
            {stats.lowStockAlerts.count}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.lowStockAlerts.subtitle}</p>
        </MetricCard>

        <MaintenanceCard maintenance={stats.maintenanceQueue} />
      </section>

      <section className="relative z-10 mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RevenueChartCard />
        <div className="flex flex-col gap-6 xl:col-span-1">
          <ZoneChartCard />
          <RecentSalesCard sales={recentSalesMock} />
        </div>
      </section>
    </div>
  )
}
