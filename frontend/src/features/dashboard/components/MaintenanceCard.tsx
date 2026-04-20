import { Wrench } from 'lucide-react'

import type { DashboardStats } from '@/features/dashboard/data/dashboardStats'
import { cn } from '@/lib/utils'

type Props = {
  maintenance: DashboardStats['maintenanceQueue']
  className?: string
}

export function MaintenanceCard({ maintenance, className }: Props) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-xl bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(11,28,48,0.02)] transition-transform duration-300 hover:-translate-y-0.5 xl:col-span-2',
        className,
      )}
    >
      <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-[var(--outline-variant)]" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-surface-low text-primary">
            <Wrench className="size-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-primary">Maintenance Queue</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {maintenance.totalFlagged} Vehicles Flagged
            </p>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <div className="flex-1 rounded-lg bg-[#ffdad6]/30 p-3">
            <p className="mb-1 text-xs font-bold text-muted-foreground">Critical</p>
            <p className="text-xl font-black text-[#93000a]">{maintenance.critical}</p>
          </div>
          <div className="flex-1 rounded-lg bg-surface-high p-3">
            <p className="mb-1 text-xs font-bold text-muted-foreground">Scheduled</p>
            <p className="text-xl font-black text-primary">{maintenance.scheduled}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
