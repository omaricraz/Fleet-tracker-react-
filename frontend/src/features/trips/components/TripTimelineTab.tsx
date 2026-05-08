import { MapPin, Play, ShoppingCart, Truck } from 'lucide-react'

import type { TimelineEntry } from '@/features/trips/types'
import { cn } from '@/lib/utils'

function NodeIcon({
  variant,
  isCurrent,
}: {
  variant: TimelineEntry['variant']
  isCurrent: boolean
}) {
  const common = cn(
    'flex size-9 items-center justify-center rounded-full border-[3px] shadow-md transition-shadow',
    isCurrent
      ? 'border-primary-fixed bg-primary text-primary-foreground shadow-[0_0_0_6px_rgb(211_228_255/0.35)] dark:border-primary-fixed-dim dark:shadow-[0_0_0_6px_rgb(17_44_73/0.55)]'
      : 'border-surface-lowest bg-surface-lowest dark:border-card',
  )

  if (variant === 'shipping') {
    return (
      <div
        className={cn(
          common,
          !isCurrent && 'bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950/80 dark:to-blue-950/60',
        )}
      >
        <Truck
          className={cn('size-4', isCurrent ? 'text-primary-foreground' : 'text-sky-700 dark:text-sky-300')}
          aria-hidden
        />
      </div>
    )
  }
  if (variant === 'depart') {
    return (
      <div
        className={cn(
          common,
          !isCurrent && 'bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/70 dark:to-violet-950/50',
        )}
      >
        <Play
          className={cn('size-4', isCurrent ? 'text-primary-foreground' : 'text-indigo-700 dark:text-indigo-200')}
          aria-hidden
        />
      </div>
    )
  }
  if (variant === 'sale') {
    return (
      <div
        className={cn(
          common,
          !isCurrent && 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/70 dark:to-teal-950/50',
        )}
      >
        <ShoppingCart
          className={cn('size-4', isCurrent ? 'text-primary-foreground' : 'text-emerald-700 dark:text-emerald-300')}
          aria-hidden
        />
      </div>
    )
  }
  return (
    <div
      className={cn(
        common,
        'animate-[pulse_3s_ease-in-out_infinite]',
        !isCurrent && 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
      )}
    >
      <MapPin className="size-4" aria-hidden />
    </div>
  )
}

export function TripTimelineTab({
  entries,
  heading = 'Route Timeline',
}: {
  entries: TimelineEntry[]
  heading?: string
}) {
  return (
    <section className="space-y-4">
      <div className="px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{heading}</h3>
        <div className="mt-2 h-px w-12 rounded-full bg-gradient-to-r from-primary to-transparent opacity-80" />
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface-lowest/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm dark:bg-card/60">
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-primary-fixed/25 blur-3xl dark:bg-primary/10"
          aria-hidden
        />
        <div className="relative space-y-0 pr-1">
          {entries.map((entry, index) => {
            const isLast = index === entries.length - 1
            const isCurrent = entry.variant === 'transit'
            return (
              <div key={entry.id} className="flex gap-4">
                <div className="flex w-11 shrink-0 flex-col items-center pt-0.5">
                  <NodeIcon variant={entry.variant} isCurrent={isCurrent} />
                  {!isLast ? (
                    <div
                      className="mt-1 min-h-[24px] w-px flex-1 bg-gradient-to-b from-primary/45 via-[var(--outline-variant)]/45 to-[var(--outline-variant)]/15 dark:from-primary-fixed-dim/50"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div
                  className={cn(
                    'mb-6 min-w-0 flex-1 rounded-xl border px-4 py-3.5 transition-colors',
                    isCurrent
                      ? 'border-primary/35 bg-gradient-to-br from-primary-fixed/40 to-surface-high/60 shadow-sm dark:from-primary/25 dark:to-surface-high/30'
                      : 'border-border/40 bg-surface-low/55 dark:bg-muted/35',
                  )}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {entry.time ? (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-primary dark:bg-primary/20 dark:text-primary">
                        {entry.time}
                      </span>
                    ) : null}
                    <p className="text-sm font-bold tracking-tight text-foreground">{entry.title}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{entry.subtitle}</p>
                  {isCurrent ? (
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-primary dark:text-primary-fixed-dim">
                      Current status
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
