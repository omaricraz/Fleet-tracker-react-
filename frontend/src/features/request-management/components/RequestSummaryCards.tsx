import { cn } from '@/lib/utils'

import type { RequestMetrics } from '../types'

interface RequestSummaryCardsProps {
  metrics: RequestMetrics | null
  loading: boolean
}

function SummaryCard({
  label,
  value,
  accentClass,
}: {
  label: string
  value: string
  accentClass: string
}) {
  return (
    <div className="surface-panel relative overflow-hidden rounded-xl border border-border/60 p-5 shadow-sm">
      <div
        className={cn('absolute bottom-0 left-0 top-0 w-1 rounded-r-full', accentClass)}
        aria-hidden
      />
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-black tracking-tight text-primary">{value}</p>
    </div>
  )
}

export function RequestSummaryCards({ metrics, loading }: RequestSummaryCardsProps) {
  const display = loading || !metrics

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Total requests"
        value={display ? '—' : String(metrics.total)}
        accentClass="bg-primary"
      />
      <SummaryCard
        label="Pending"
        value={display ? '—' : String(metrics.pending)}
        accentClass="bg-warning"
      />
      <SummaryCard
        label="Approved"
        value={display ? '—' : String(metrics.approved)}
        accentClass="bg-success"
      />
      <SummaryCard
        label="Rejected"
        value={display ? '—' : String(metrics.rejected)}
        accentClass="bg-destructive"
      />
    </div>
  )
}
