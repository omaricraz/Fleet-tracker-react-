import { cn } from '@/lib/utils'

type HintTone = 'success' | 'muted'

const hintClass: Record<HintTone, string> = {
  success: 'text-emerald-600',
  muted: 'text-muted-foreground',
}

interface KpiStatCardProps {
  label: string
  value: string
  hint: string
  hintTone?: HintTone
  className?: string
}

export function KpiStatCard({
  label,
  value,
  hint,
  hintTone = 'muted',
  className,
}: KpiStatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-card p-5 shadow-sm ring-1 ring-border/60',
        className,
      )}
    >
      <div
        className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-primary"
        aria-hidden
      />
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-black tracking-tighter text-foreground">{value}</span>
        <span className={cn('text-xs font-semibold', hintClass[hintTone])}>{hint}</span>
      </div>
    </div>
  )
}
