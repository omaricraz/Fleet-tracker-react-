import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { TripWorkspacePanel } from '@/features/trips/components/TripWorkspacePanel'
import type { TripWorkspaceDetail } from '@/features/trips/types'
import type { OperationDrawerTabId } from '@/features/trips/operations/types'
import type { TripDetailData } from '@/services/api/types'
import type { ProductResource } from '@/services/api/types'
import { cn } from '@/lib/utils'

export interface TripOperationDrawerProps {
  open: boolean
  layout: 'desktop' | 'drawer'
  tripId: string | null
  detailLoading: boolean
  detail: TripDetailData | null
  workspace: TripWorkspaceDetail | null
  productsById: Map<number, ProductResource>
  activeTab: OperationDrawerTabId
  onTabChange: (tab: OperationDrawerTabId) => void
  onClose: () => void
  canManageRequests: boolean
  onInventoryError: (msg: string) => void
  onOpening?: () => void
  onLoad?: () => void
  onCloseCount?: () => void
  onEndTrip?: () => void
  onDeleteTrip?: () => void
  tripActionPending?: boolean
}

export function TripOperationDrawer({
  open,
  layout,
  tripId,
  detailLoading,
  workspace,
  productsById: _productsById,
  activeTab,
  onTabChange,
  onClose,
  canManageRequests: _canManageRequests,
  onInventoryError: _onInventoryError,
  detail: _detail,
  ...panelRest
}: TripOperationDrawerProps) {
  void _productsById
  void _canManageRequests
  void _onInventoryError
  void _detail

  if (layout === 'drawer' && !open) {
    return null
  }

  const showSkeleton = Boolean(tripId) && detailLoading && !workspace

  return (
    <div
      className={cn(
        layout === 'desktop' && 'sticky top-24 h-[calc(100vh-6.5rem)] w-full max-w-[520px] shrink-0',
        layout === 'drawer' && 'h-full',
      )}
    >
      {showSkeleton ? (
        <div className="flex h-full flex-col gap-3 rounded-l-xl border border-border/60 bg-surface-lowest p-6">
          <LoadingSkeleton className="h-10 w-2/3" />
          <LoadingSkeleton className="h-32 w-full" />
          <LoadingSkeleton className="min-h-[240px] flex-1" />
        </div>
      ) : (
        <TripWorkspacePanel
          detail={workspace}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={onClose}
          layout={layout}
          {...panelRest}
        />
      )}
    </div>
  )
}
