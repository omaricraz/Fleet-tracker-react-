import { Truck, User, X } from 'lucide-react'

import { TripInventoryTab } from '@/features/trips/components/TripInventoryTab'
import { TripSalesTab } from '@/features/trips/components/TripSalesTab'
import { TripTimelineTab } from '@/features/trips/components/TripTimelineTab'
import type { TripWorkspaceDetail, WorkspaceTabId } from '@/features/trips/types'
import { cn } from '@/lib/utils'

const tabs: { id: WorkspaceTabId; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
]

export interface TripWorkspacePanelProps {
  detail: TripWorkspaceDetail | null
  activeTab: WorkspaceTabId
  onTabChange: (tab: WorkspaceTabId) => void
  onClose: () => void
  layout: 'desktop' | 'drawer'
}

export function TripWorkspacePanel({
  detail,
  activeTab,
  onTabChange,
  onClose,
  layout,
}: TripWorkspacePanelProps) {
  if (!detail) {
    return (
      <aside
        className={cn(
          'flex flex-col border-[var(--outline-variant)]/20 bg-surface-lowest shadow-2xl',
          layout === 'desktop' &&
            'sticky top-24 max-h-[calc(100vh-6.5rem)] w-full max-w-[500px] shrink-0 overflow-hidden rounded-l-xl border-l',
          layout === 'drawer' && 'h-full w-full max-w-none border-l-0',
        )}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm font-bold text-primary">Operational Workspace</p>
          <p className="text-xs text-muted-foreground">
            Select a trip from the grid to view timeline, inventory, and sales.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-[var(--outline-variant)]/20 bg-surface-lowest shadow-2xl',
        layout === 'desktop' &&
          'sticky top-24 max-h-[calc(100vh-6.5rem)] w-full max-w-[500px] shrink-0 overflow-hidden rounded-l-xl border-l',
        layout === 'drawer' && 'h-full w-full max-w-none overflow-hidden border-l-0',
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/50 p-6">
        <div>
          <span className="rounded bg-primary-fixed px-2 py-0.5 text-[10px] font-black uppercase text-primary">
            Operational Workspace
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tighter text-primary">
            {detail.displayId}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
          aria-label="Close workspace"
        >
          <X className="size-5 text-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-surface-low p-1">
        <div className="bg-surface-lowest p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Revenue</p>
          <p className="text-lg font-black text-primary">{detail.revenue}</p>
        </div>
        <div className="bg-surface-lowest p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Distance</p>
          <p className="text-lg font-black text-primary">{detail.distance}</p>
        </div>
        <div className="bg-surface-lowest p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Customers</p>
          <p className="text-lg font-black text-primary">{detail.customers}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-border/50 bg-surface-low/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="size-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Driver</p>
            <p className="truncate text-sm font-bold text-primary">{detail.driverName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Truck className="size-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Vehicle</p>
            <p className="truncate text-sm font-bold text-primary">{detail.vehicleLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border/50 px-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              'px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors',
              activeTab === t.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {activeTab === 'timeline' ? <TripTimelineTab entries={detail.timeline} /> : null}
        {activeTab === 'inventory' ? <TripInventoryTab rows={detail.inventory} /> : null}
        {activeTab === 'sales' ? <TripSalesTab rows={detail.sales} /> : null}
      </div>

      <div className="mt-auto flex gap-4 border-t border-border/50 bg-surface-low p-6">
        <button
          type="button"
          className="flex-1 rounded-md border-2 border-primary py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          Edit Trip
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-destructive py-3 text-sm font-bold text-destructive-foreground shadow-lg transition-all hover:opacity-90"
        >
          Delete Trip
        </button>
      </div>
    </aside>
  )
}
