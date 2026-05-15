import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ProductResource } from '@/services/api/types'

import { ProductSearchSelect } from './ProductSearchSelect'
import type { InventoryAdjustmentMode, InventoryFormLine } from './types'

const fieldClass =
  'h-9 w-full rounded-md border border-border/60 bg-surface-lowest px-2.5 text-sm tabular-nums outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60'

export interface RepeatableInventoryLinesEditorProps {
  rows: InventoryFormLine[]
  onAddRow: () => void
  onRemoveRow: (rowId: string) => void
  onChangeRow: (
    rowId: string,
    patch: Partial<Pick<InventoryFormLine, 'productId' | 'productLabel' | 'quantity' | 'adjustmentMode'>>,
  ) => void
  /** Per-row search filter (rowId -> string); parent debounces API */
  filters: Record<string, string>
  onFilterChange: (rowId: string, next: string) => void
  getProductsForRow: (rowId: string) => ProductResource[]
  getProductsLoading: (rowId: string) => boolean
  getProductsError: (rowId: string) => boolean
  onRowSearchActivate?: (rowId: string) => void
  disabled?: boolean
  /** Load-style rows, optionally with per-line increase/decrease for adjustments. */
  variant?: 'default' | 'adjustment'
  /** Hide the “Line items” header and Add more control (e.g. fixed product lists). */
  showAddRow?: boolean
}

export function RepeatableInventoryLinesEditor({
  rows,
  onAddRow,
  onRemoveRow,
  onChangeRow,
  filters,
  onFilterChange,
  getProductsForRow,
  getProductsLoading,
  getProductsError,
  onRowSearchActivate,
  disabled = false,
  variant = 'default',
  showAddRow = true,
}: RepeatableInventoryLinesEditorProps) {
  const excludeForRow = (rowId: string) => {
    const ids = new Set<number>()
    for (const r of rows) {
      if (r.rowId === rowId) continue
      if (r.productId != null) ids.add(r.productId)
    }
    return ids
  }

  const adjustmentModeFor = (r: InventoryFormLine): InventoryAdjustmentMode => r.adjustmentMode ?? 'increase'

  return (
    <div className="space-y-3">
      {showAddRow ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Line items</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-primary/50 text-xs font-bold text-primary"
            disabled={disabled}
            onClick={onAddRow}
          >
            <Plus className="size-3.5" aria-hidden />
            Add more
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((r, idx) => (
          <div
            key={r.rowId}
            className="rounded-lg border border-border/50 bg-surface-lowest/50 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] dark:shadow-none"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black tabular-nums text-muted-foreground">#{idx + 1}</span>
              {showAddRow ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={disabled || rows.length <= 1}
                  onClick={() => onRemoveRow(r.rowId)}
                  aria-label={`Remove row ${idx + 1}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <ProductSearchSelect
                products={getProductsForRow(r.rowId)}
                loading={getProductsLoading(r.rowId)}
                error={getProductsError(r.rowId)}
                filter={filters[r.rowId] ?? ''}
                onFilterChange={(next) => onFilterChange(r.rowId, next)}
                onFilterFocus={() => onRowSearchActivate?.(r.rowId)}
                value={r.productId}
                excludeProductIds={excludeForRow(r.rowId)}
                disabled={disabled}
                onChange={(productId, product) =>
                  onChangeRow(r.rowId, { productId, productLabel: product.item })
                }
              />
              {variant === 'adjustment' ? (
                <div className="flex w-full flex-col gap-1 sm:max-w-[11rem] sm:shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Mode</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={adjustmentModeFor(r) === 'increase' ? 'default' : 'outline'}
                      className="h-9 flex-1 px-2 text-xs font-bold"
                      disabled={disabled}
                      onClick={() => onChangeRow(r.rowId, { adjustmentMode: 'increase' })}
                    >
                      Increase
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={adjustmentModeFor(r) === 'decrease' ? 'default' : 'outline'}
                      className="h-9 flex-1 px-2 text-xs font-bold"
                      disabled={disabled}
                      onClick={() => onChangeRow(r.rowId, { adjustmentMode: 'decrease' })}
                    >
                      Decrease
                    </Button>
                  </div>
                </div>
              ) : null}
              <label className="flex shrink-0 flex-col gap-1 sm:w-28">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Qty</span>
                <input
                  type="number"
                  step="any"
                  min={0}
                  disabled={disabled}
                  value={r.quantity}
                  onChange={(e) => onChangeRow(r.rowId, { quantity: e.target.value })}
                  className={fieldClass}
                  placeholder="0"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
