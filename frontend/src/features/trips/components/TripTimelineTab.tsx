import { MapPin, Play, ShoppingCart, Truck } from 'lucide-react'

import type { TimelineEntry } from '@/features/trips/types'

function NodeIcon({ variant }: { variant: TimelineEntry['variant'] }) {
  if (variant === 'shipping') {
    return (
      <div className="flex size-6 items-center justify-center rounded-full border-4 border-white bg-blue-100 dark:border-surface-lowest dark:bg-blue-950/60">
        <Truck className="size-3 text-blue-600 dark:text-blue-300" aria-hidden />
      </div>
    )
  }
  if (variant === 'depart') {
    return (
      <div className="flex size-6 items-center justify-center rounded-full border-4 border-white bg-blue-100 dark:border-surface-lowest dark:bg-blue-950/60">
        <Play className="size-3 text-blue-600 dark:text-blue-300" aria-hidden />
      </div>
    )
  }
  if (variant === 'sale') {
    return (
      <div className="flex size-6 items-center justify-center rounded-full border-4 border-white bg-green-100 dark:border-surface-lowest dark:bg-emerald-950/50">
        <ShoppingCart className="size-3 text-green-600 dark:text-emerald-300" aria-hidden />
      </div>
    )
  }
  return (
    <div className="flex size-6 animate-pulse items-center justify-center rounded-full border-4 border-white bg-primary dark:border-surface-lowest">
      <MapPin className="size-3 text-primary-foreground" aria-hidden />
    </div>
  )
}

export function TripTimelineTab({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        Route Timeline
      </h3>
      <div className="relative pr-2">
        <div
          className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-[var(--outline-variant)]/40"
          aria-hidden
        />
        <div className="space-y-8 pl-8">
          {entries.map((entry) => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[30px] top-0">
                <NodeIcon variant={entry.variant} />
              </div>
              <div>
                <p className="text-xs font-black text-primary">
                  {entry.time ? `${entry.time} ` : ''}
                  {entry.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{entry.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
