import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type KpiAccent = 'primary' | 'muted' | 'success'

const accentBar: Record<KpiAccent, string> = {
  primary: 'bg-primary',
  muted: 'bg-primary-container',
  success: 'bg-success',
}

interface KpiCardProps {
  label: string
  value: string
  delta?: string
  deltaBadge?: ReactNode
  accent?: KpiAccent
  className?: string
}

export function KpiCard({
  label,
  value,
  delta,
  deltaBadge,
  accent = 'primary',
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'surface-panel relative overflow-hidden rounded-xl border border-border/60 p-6 shadow-sm',
        className,
      )}
    >
      <div
        className={cn('absolute bottom-0 left-0 top-0 w-1 rounded-r-full', accentBar[accent])}
        aria-hidden
      />
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-primary">{value}</span>
        {delta ? (
          <span className="text-xs font-bold text-success">{delta}</span>
        ) : null}
        {deltaBadge}
      </div>
    </div>
  )
}
