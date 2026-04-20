import { TrendingUp } from 'lucide-react'

import type { DashboardStats } from '@/features/dashboard/data/dashboardStats'
import { cn } from '@/lib/utils'

type Props = {
  sales: DashboardStats['salesToday']
  className?: string
}

export function HeroMetricCard({ sales, className }: Props) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-surface-lowest p-8 shadow-[0_4px_20px_rgba(11,28,48,0.02)] transition-transform duration-300 hover:-translate-y-1 xl:col-span-2',
        className,
      )}
    >
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="mb-8 flex items-start justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Sales Today
          </h3>
          <span className="flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-accent-foreground">
            <TrendingUp className="size-3.5" aria-hidden />
            {sales.changePercent}
          </span>
        </div>
        <div>
          <p className="mb-1 text-5xl font-black tracking-tighter text-primary md:text-6xl">
            {sales.amountFormatted}
            <span className="ml-1 text-2xl font-medium text-[var(--outline-variant)]">
              {sales.amountCentsDisplay}
            </span>
          </p>
          <p className="text-sm text-secondary">{sales.subtitle}</p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-gradient-to-br from-primary-fixed/30 to-surface-high blur-3xl transition-transform duration-700 ease-out group-hover:scale-110"
        aria-hidden
      />
    </div>
  )
}
