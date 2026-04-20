import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationBarProps {
  page: number
  pageSize: number
  total: number
  entityLabel: string
  onPageChange: (page: number) => void
}

export function PaginationBar({
  page,
  pageSize,
  total,
  entityLabel,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 bg-muted/30 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Showing {from} to {to} of {total} {entityLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-surface-high"
          disabled={!canPrev}
          aria-label="Previous page"
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={cn(
              'flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-colors',
              n === safePage
                ? 'bg-primary text-primary-foreground'
                : 'font-medium text-muted-foreground hover:bg-surface-high',
            )}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-surface-high"
          disabled={!canNext}
          aria-label="Next page"
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
