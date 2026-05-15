import { cn } from '@/lib/utils'

import type { ClosingCountLineState } from './types'

const qtyInputClass =
  'h-9 w-full rounded-md border border-border/60 bg-surface-lowest px-2.5 text-sm tabular-nums outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60'

const headerGrid =
  'grid grid-cols-1 gap-px bg-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:grid-cols-[minmax(0,1fr)_4.25rem_4.25rem_4.75rem_4.25rem]'

const rowGrid =
  'grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_4.25rem_4.25rem_4.75rem_4.25rem] sm:items-center sm:gap-2'

export interface ClosingCountAuditTableProps {
  lines: ClosingCountLineState[]
  onClosingChange: (productId: number, closingQty: string) => void
  disabled?: boolean
  /** Override header for the editable quantity column (default: Close). */
  quantityHeader?: string
  /** Override mobile label above the quantity input (default: Closing). */
  quantityMobileLabel?: string
  /** Override Δ column description (default: Δ vs open+load). */
  deltaMobileLabel?: string
}

export function ClosingCountAuditTable({
  lines,
  onClosingChange,
  disabled = false,
  quantityHeader = 'Close',
  quantityMobileLabel = 'Closing',
  deltaMobileLabel = 'Δ vs open+load',
}: ClosingCountAuditTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      <div className={headerGrid}>
        <div className="bg-surface-low px-3 py-2">Product</div>
        <div className="bg-surface-low px-2 py-2 text-right">Open</div>
        <div className="bg-surface-low px-2 py-2 text-right">Load</div>
        <div className="bg-surface-low px-2 py-2 text-right">{quantityHeader}</div>
        <div className="bg-surface-low px-2 py-2 text-right">Δ</div>
      </div>
      <ul className="divide-y divide-border/40 bg-surface-lowest/40">
        {lines.map((line) => {
          const closeParsed = Number.parseFloat(line.closing_qty)
          const closeNum = Number.isFinite(closeParsed) ? closeParsed : null
          const baseline = line.opening_qty + line.loaded_qty
          const delta = closeNum != null ? closeNum - baseline : null
          const hasDelta = delta != null && delta !== 0
          const loadOnly = line.opening_qty === 0 && line.loaded_qty > 0
          return (
            <li
              key={line.product_id}
              className={cn(
                rowGrid,
                hasDelta ? 'bg-amber-500/5 dark:bg-amber-400/10' : '',
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-foreground">{line.product_name}</p>
                <p className="text-[10px] font-medium tabular-nums text-muted-foreground">
                  SKU #{line.product_id}
                  {loadOnly ? (
                    <span className="ml-1.5 rounded bg-primary/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                      Load line
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-col gap-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">
                  Opening
                </span>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">{line.opening_qty}</span>
              </div>
              <div className="flex flex-col gap-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">
                  Loaded
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    line.loaded_qty > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground',
                  )}
                >
                  {line.loaded_qty > 0 ? line.loaded_qty : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">
                  {quantityMobileLabel}
                </span>
                <input
                  type="number"
                  step="any"
                  min={0}
                  disabled={disabled}
                  value={line.closing_qty}
                  onChange={(e) => onClosingChange(line.product_id, e.target.value)}
                  className={qtyInputClass}
                  aria-label={`${quantityMobileLabel} quantity for ${line.product_name}`}
                />
              </div>
              <div className="flex flex-col gap-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">
                  {deltaMobileLabel}
                </span>
                <span
                  className={cn(
                    'text-sm font-black tabular-nums',
                    delta == null
                      ? 'text-muted-foreground'
                      : delta === 0
                        ? 'text-muted-foreground'
                        : delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400',
                  )}
                >
                  {delta == null ? '—' : delta > 0 ? `+${delta}` : `${delta}`}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
