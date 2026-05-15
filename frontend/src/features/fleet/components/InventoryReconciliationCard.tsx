import { Scale } from 'lucide-react'
import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { DriverInventoryData, DriverInventoryReconciliationLine } from '@/services/api/types'

export type InventoryTx = DriverInventoryData['transactions'][number]

type ClosingPick = { at: number; id: number; qty: number; variance: number | null }

type GroupAcc = {
  product_id: number
  product_name: string
  opening: number
  load: number
  adjustment: number
  returnQty: number
  sales: number
  closingLatest: ClosingPick | null
}

export type InventoryReconciliationRow = {
  product_id: number
  product_name: string
  opening: number
  load: number
  adjustment: number
  return: number
  sales: number
  closing: number | null
  /** From API (`reconciliation` lines or latest closing transaction); not computed on the client. */
  variance: number | null
}

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

export function inventoryTxQuantityToNumber(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/** Parses API variance; returns null when the field is absent or not numeric. */
export function inventoryApiVarianceToNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t === '') return null
    const n = Number.parseFloat(t)
    return Number.isFinite(n) ? n : null
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return null
}

function transactionTimeMs(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

function formatQty(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function reconciliationVarianceForProduct(
  lines: readonly DriverInventoryReconciliationLine[] | undefined,
  productId: number,
): number | null {
  if (!lines?.length) return null
  for (const line of lines) {
    if (Number(line.product_id) !== productId) continue
    const v = inventoryApiVarianceToNumber(line.variance)
    if (v != null) return v
  }
  return null
}

function pickRowVariance(
  reconciliation: readonly DriverInventoryReconciliationLine[] | undefined,
  productId: number,
  closingVarianceFromTx: number | null,
): number | null {
  const fromPayload = reconciliationVarianceForProduct(reconciliation, productId)
  if (fromPayload != null) return fromPayload
  return closingVarianceFromTx
}

/**
 * Groups inventory transactions by product_id using a single reduce pass.
 */
export function buildInventoryReconciliationRows(
  transactions: readonly InventoryTx[],
  reconciliation?: readonly DriverInventoryReconciliationLine[],
): InventoryReconciliationRow[] {
  const byProduct = transactions.reduce<Map<number, GroupAcc>>((map, tx) => {
    const productId = Number(tx.product_id)
    if (!Number.isFinite(productId)) return map

    const label = pickString(tx.product_name).trim() || `Product #${productId}`
    let acc = map.get(productId)
    if (!acc) {
      acc = {
        product_id: productId,
        product_name: label,
        opening: 0,
        load: 0,
        adjustment: 0,
        returnQty: 0,
        sales: 0,
        closingLatest: null,
      }
      map.set(productId, acc)
    } else if (label) {
      acc.product_name = label
    }

    const qty = inventoryTxQuantityToNumber(tx.quantity)
    const tNorm = pickString(tx.type).trim().toLowerCase()

    switch (tNorm) {
      case 'opening':
        acc.opening += qty
        break
      case 'load':
        acc.load += qty
        break
      case 'adjustment':
        acc.adjustment += qty
        break
      case 'return':
        acc.returnQty += qty
        break
      case 'sale':
        acc.sales += qty
        break
      case 'close':
      case 'closing':
      case 'closing_count': {
        const at = transactionTimeMs(tx.created_at)
        const id = Number(tx.id)
        const safeId = Number.isFinite(id) ? id : 0
        const variance = inventoryApiVarianceToNumber(tx.variance)
        const next: ClosingPick = { at, id: safeId, qty, variance }
        if (
          !acc.closingLatest ||
          next.at > acc.closingLatest.at ||
          (next.at === acc.closingLatest.at && next.id >= acc.closingLatest.id)
        ) {
          acc.closingLatest = next
        }
        break
      }
      default:
        break
    }

    return map
  }, new Map())

  const rows: InventoryReconciliationRow[] = Array.from(byProduct.values()).map((g) => {
    const closing = g.closingLatest != null ? g.closingLatest.qty : null
    const varianceFromClosingTx = g.closingLatest != null ? g.closingLatest.variance : null
    const variance = pickRowVariance(reconciliation, g.product_id, varianceFromClosingTx)
    return {
      product_id: g.product_id,
      product_name: g.product_name,
      opening: g.opening,
      load: g.load,
      adjustment: g.adjustment,
      return: g.returnQty,
      sales: g.sales,
      closing,
      variance,
    }
  })

  return rows.sort((a, b) => a.product_name.localeCompare(b.product_name, undefined, { sensitivity: 'base' }))
}

const thClass =
  'px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground first:pl-3 first:text-left last:pr-3'
const tdNum = 'px-2 py-1.5 text-right tabular-nums text-sm text-muted-foreground first:pl-3 last:pr-3'

export function InventoryReconciliationCard(props: {
  transactions: readonly InventoryTx[]
  reconciliation?: readonly DriverInventoryReconciliationLine[]
}) {
  const { transactions, reconciliation } = props

  const rows = useMemo(
    () => buildInventoryReconciliationRows(transactions, reconciliation),
    [transactions, reconciliation],
  )
  const empty = transactions.length === 0

  return (
    <section className="surface-panel rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <Scale className="size-5 text-primary" aria-hidden />
        <h2 className="text-base font-bold text-foreground">Inventory Reconciliation</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        One row per product rolled up from transaction history. Variance is supplied by the inventory API when present
        (reconciliation payload or closing transaction); it is not derived in the browser.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              <th className={cn(thClass, 'min-w-[140px]')}>Product</th>
              <th className={thClass}>Opening</th>
              <th className={thClass}>Load</th>
              <th className={thClass}>Adjustment</th>
              <th className={thClass}>Return</th>
              <th className={thClass}>Sales</th>
              <th className={thClass}>Closing</th>
              <th className={thClass}>Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {empty ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No transactions yet — reconciliation appears after inventory activity is recorded.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.product_id}
                  className="transition-colors hover:bg-muted/35"
                >
                  <td className="px-3 py-1.5 pr-2 align-middle text-sm font-semibold text-foreground">{row.product_name}</td>
                  <td className={tdNum}>{formatQty(row.opening)}</td>
                  <td className={tdNum}>{formatQty(row.load)}</td>
                  <td className={tdNum}>{formatQty(row.adjustment)}</td>
                  <td className={tdNum}>{formatQty(row.return)}</td>
                  <td className={tdNum}>{formatQty(row.sales)}</td>
                  <td className={tdNum}>{row.closing != null ? formatQty(row.closing) : '—'}</td>
                  <td
                    className={cn(
                      tdNum,
                      'font-medium',
                      row.variance == null
                        ? 'text-muted-foreground'
                        : row.variance > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : row.variance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground',
                    )}
                  >
                    {row.variance != null ? formatQty(row.variance) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
