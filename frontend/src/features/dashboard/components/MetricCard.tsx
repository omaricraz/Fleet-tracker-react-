import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Accent = 'muted' | 'tertiary-dim' | 'primary-dim' | 'error'

const accentBar: Record<Accent, string> = {
  muted: 'bg-[#b9c7df]',
  'tertiary-dim': 'bg-[#afc8ed]',
  'primary-dim': 'bg-[#afc8ed]',
  error: 'bg-[#ffdad6]',
}

type Props = {
  title: string
  accent?: Accent
  icon?: LucideIcon
  iconClassName?: string
  /** Replaces the icon slot (e.g. alert pulse). */
  trailing?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function MetricCard({
  title,
  accent = 'muted',
  icon: Icon,
  iconClassName,
  trailing,
  children,
  footer,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-xl bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(11,28,48,0.02)] transition-transform duration-300 hover:-translate-y-0.5',
        className,
      )}
    >
      <div
        className={cn(
          'absolute bottom-0 left-0 top-0 w-1 rounded-l-xl',
          accentBar[accent],
        )}
      />
      <div className="relative z-10 flex flex-col">
        <div className="mb-6 flex items-start justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
          {trailing ??
            (Icon ? (
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full bg-surface-low text-secondary',
                  iconClassName,
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </div>
            ) : null)}
        </div>
        {children}
        {footer ? <div className="mt-1">{footer}</div> : null}
      </div>
    </div>
  )
}
