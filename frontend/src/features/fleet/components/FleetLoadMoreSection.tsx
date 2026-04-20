import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface FleetLoadMoreSectionProps {
  remainingCount: number
  onLoadMore: () => void
  loaded: boolean
}

export function FleetLoadMoreSection({
  remainingCount,
  onLoadMore,
  loaded,
}: FleetLoadMoreSectionProps) {
  if (remainingCount <= 0 || loaded) {
    return null
  }

  return (
    <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-surface-lowest p-6 py-12 shadow-sm">
      <div className="text-center">
        <MoreHorizontal className="mx-auto mb-2 size-10 text-muted-foreground" aria-hidden />
        <p className="font-medium text-muted-foreground">
          {remainingCount} more vehicles currently active in the field
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-4 font-black uppercase tracking-widest text-primary hover:bg-transparent hover:underline"
          onClick={onLoadMore}
        >
          Load All Vehicles
        </Button>
      </div>
    </div>
  )
}
