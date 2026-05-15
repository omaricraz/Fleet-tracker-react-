import { Bell, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  INVENTORY_ALERTS_BELL_RECENT_HOURS,
  INVENTORY_ALERTS_PAGE_PATH,
  INVENTORY_ALERTS_POLL_INTERVAL_MS,
} from '@/features/inventory-alerts/constants'
import {
  filterAlertsWithinHours,
  sortInventoryAlertsForDisplay,
} from '@/features/inventory-alerts/normalizeInventoryAlerts'
import { useInventoryAlertsFeed } from '@/features/inventory-alerts/useInventoryAlertsFeed'
import { useAuth } from '@/features/auth/AuthContext'
import { canAccessPath } from '@/features/auth/permissions'
import { fleetVehicleProfilePath } from '@/features/fleet/fleetPaths'
import type { InventoryAlertItem } from '@/services/api/types'
import { cn } from '@/lib/utils'

type InventoryAlertsBellProps = {
  buttonVariant?: 'ghost' | 'secondary'
}

function alertBadgeVariant(kind: string): 'destructive' | 'warning' | 'secondary' {
  if (kind === 'zero_stock') return 'destructive'
  if (kind === 'low_stock') return 'warning'
  return 'secondary'
}

function AlertPopoverRow({
  alert,
  onOpenVehicle,
}: {
  alert: InventoryAlertItem
  onOpenVehicle?: (carId: number) => void
}) {
  const carId = alert.car_id
  const canOpenVehicle =
    typeof carId === 'number' && Number.isFinite(carId) && typeof onOpenVehicle === 'function'

  const rowClass = cn(
    'flex gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
    'hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15',
    canOpenVehicle && 'cursor-pointer',
  )

  const inner = (
    <>
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          alert.kind === 'zero_stock' ? 'bg-destructive' : alert.kind === 'low_stock' ? 'bg-warning' : 'bg-muted-foreground',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <Badge variant={alertBadgeVariant(alert.kind)} className="mb-1 text-[10px]">
          {alert.title}
        </Badge>
        <p className="truncate text-sm font-semibold text-foreground">{alert.car_name ?? `Car #${alert.car_id ?? '—'}`}</p>
        <p className="truncate text-xs text-muted-foreground">{alert.product_name ?? `Product #${alert.product_id ?? '—'}`}</p>
        {alert.quantity != null ? (
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">Qty {alert.quantity}</p>
        ) : null}
      </div>
    </>
  )

  if (canOpenVehicle) {
    const labelVehicle = alert.car_name?.trim() || `Vehicle ${carId}`
    return (
      <button
        type="button"
        className={cn(
          rowClass,
          'w-full border-0 bg-transparent font-inherit shadow-none outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
        onClick={() => onOpenVehicle(carId)}
        aria-label={`Open ${labelVehicle} profile`}
      >
        {inner}
      </button>
    )
  }

  return <div className={rowClass}>{inner}</div>
}

export function InventoryAlertsBell({ buttonVariant = 'secondary' }: InventoryAlertsBellProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const canUse = Boolean(user && canAccessPath(user, INVENTORY_ALERTS_PAGE_PATH))
  const feed = useInventoryAlertsFeed(canUse)

  const recentAlerts = useMemo(() => {
    const rows = feed.data ?? []
    const filtered = filterAlertsWithinHours(rows, INVENTORY_ALERTS_BELL_RECENT_HOURS)
    return sortInventoryAlertsForDisplay(filtered)
  }, [feed.data])

  const pollMinutes = INVENTORY_ALERTS_POLL_INTERVAL_MS / 60_000
  const badgeCount = recentAlerts.length

  useEffect(() => {
    if (!open) return
    function closeOnOutside(e: MouseEvent) {
      const el = containerRef.current
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    function closeOnEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  if (!canUse) return null

  function goToInventoryAlertsPage() {
    setOpen(false)
    navigate(INVENTORY_ALERTS_PAGE_PATH)
  }

  function goToVehicleProfile(carId: number) {
    setOpen(false)
    navigate(fleetVehicleProfilePath(carId))
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant={buttonVariant}
        size="icon"
        className="rounded-full"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? 'inventory-alerts-popover' : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className={buttonVariant === 'ghost' ? 'size-5' : 'size-[1.15rem]'} />
      </Button>
      {badgeCount > 0 ? (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center">
          <Badge
            variant="destructive"
            className="flex size-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px]"
            aria-hidden
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        </span>
      ) : null}

      {open ? (
        <>
          {/* Anchor caret */}
          <span
            className="absolute right-3 top-full z-[71] -mt-px block size-0 border-x-[7px] border-b-[8px] border-x-transparent border-b-card drop-shadow-sm"
            aria-hidden
          />
          <span className="absolute right-[11px] top-full z-[70] -mt-px block size-0 border-x-[8px] border-b-[9px] border-x-transparent border-b-border/60" aria-hidden />

          <div
            id="inventory-alerts-popover"
            role="dialog"
            aria-modal="false"
            aria-labelledby="inventory-alerts-popover-title"
            className={cn(
              'absolute right-0 top-full z-[70] mt-1.5 flex max-h-[min(420px,calc(100vh-5rem))] w-[min(calc(100vw-1rem),380px)] flex-col overflow-hidden rounded-xl border border-border/60 bg-card',
              'shadow-[0_12px_40px_-8px_rgba(0,0,0,0.28),var(--shadow-ambient)]',
            )}
          >
            <div className="border-b border-border/60 bg-surface-high/20 px-4 py-3">
              <h2 id="inventory-alerts-popover-title" className="text-sm font-black tracking-tight text-foreground">
                Notifications
              </h2>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Inventory alerts (last {INVENTORY_ALERTS_BELL_RECENT_HOURS}h where timed · refreshes every {pollMinutes}{' '}
                {pollMinutes === 1 ? 'minute' : 'minutes'})
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
              {feed.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Loading…
                </div>
              ) : feed.isError ? (
                <p className="px-3 py-8 text-center text-sm text-destructive">Could not load alerts.</p>
              ) : recentAlerts.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No alerts in this window.</p>
              ) : (
                <ul className="space-y-0.5">
                  {recentAlerts.slice(0, 12).map((a) => (
                    <li key={a.id}>
                      <AlertPopoverRow alert={a} onOpenVehicle={goToVehicleProfile} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-3 py-2">
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                onClick={goToInventoryAlertsPage}
              >
                View all alerts
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
