import type { OperationsKpiCard } from '@/features/trips/operations/types'
import { cn } from '@/lib/utils'

export interface TripOperationsKpiStripProps {
  cards: OperationsKpiCard[]
  activeFilterKey?: string
  onFilterCard: (key: string | null) => void
}

export function TripOperationsKpiStrip({ cards, activeFilterKey, onFilterCard }: TripOperationsKpiStripProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => {
        const active = activeFilterKey === c.key
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onFilterCard(active ? null : c.key)}
            className={cn(
              'surface-panel flex flex-col rounded-xl border p-4 text-left transition-colors',
              active
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border/60 hover:border-primary/40',
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.title}</span>
            <span className="mt-1 text-2xl font-black text-primary">{c.value}</span>
            {c.subtitle ? <span className="mt-0.5 text-[11px] text-muted-foreground">{c.subtitle}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
