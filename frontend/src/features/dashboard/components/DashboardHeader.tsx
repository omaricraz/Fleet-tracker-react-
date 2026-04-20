import type { DashboardStats } from '@/features/dashboard/data/dashboardStats'

type Props = {
  stats: Pick<DashboardStats, 'tenantName' | 'tenantStatusLabel' | 'heroSubtitle'>
}

export function DashboardHeader({ stats }: Props) {
  return (
    <header className="relative z-10 mb-10 md:mb-12">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {stats.tenantStatusLabel}
      </p>
      <h1 className="text-4xl font-black tracking-[-0.03em] text-primary md:text-5xl md:leading-tight">
        {stats.tenantName}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-secondary">{stats.heroSubtitle}</p>
    </header>
  )
}
