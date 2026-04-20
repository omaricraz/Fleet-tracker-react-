import { Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

export function AppLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/platform"
      className={cn('flex items-center gap-3 text-foreground transition-opacity hover:opacity-90', className)}
    >
      <div className="flex size-11 items-center justify-center rounded-xl hero-gradient text-primary-foreground shadow-[var(--shadow-soft)]">
        <Truck className="size-5" />
      </div>
      {!compact ? (
        <div className="space-y-1">
          <p className="text-lg font-black tracking-[-0.03em] text-foreground">Fleet Tracker</p>
          <p className="eyebrow text-[10px] tracking-[0.16em]">Command Center</p>
        </div>
      ) : null}
    </Link>
  )
}
