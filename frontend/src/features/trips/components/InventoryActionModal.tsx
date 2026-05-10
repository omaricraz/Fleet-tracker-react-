import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'

type ProductOption = {
  id: number
  label: string
}

type InventoryRow = {
  id: number
  productId: string
  quantity: string
}

export type InventoryActionMode = 'opening' | 'load' | 'closeCount'

interface InventoryActionModalProps {
  open: boolean
  mode: InventoryActionMode | null
  products: ProductOption[]
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: Array<{ product_id: number; quantity: number }>) => void
}

const TITLES: Record<InventoryActionMode, string> = {
  opening: 'Opening balance',
  load: 'Load inventory',
  closeCount: 'Close count',
}

const DESCRIPTIONS: Record<InventoryActionMode, string> = {
  opening: 'Add opening balance rows before trip operations.',
  load: 'Add product quantities to load into this trip.',
  closeCount: 'Submit closing quantities for this trip.',
}

function createRow(id: number, defaultProductId = ''): InventoryRow {
  return { id, productId: defaultProductId, quantity: '' }
}

export function InventoryActionModal({
  open,
  mode,
  products,
  submitting = false,
  onClose,
  onSubmit,
}: InventoryActionModalProps) {
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const firstProductId = useMemo(() => (products.length > 0 ? String(products[0]!.id) : ''), [products])

  useEffect(() => {
    if (!open) {
      setRows([])
      setError(null)
      return
    }
    setRows([createRow(1, firstProductId)])
    setError(null)
  }, [open, firstProductId])

  if (!open || !mode) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (rows.length === 0) {
      setError('Add at least one product row.')
      return
    }

    const parsedRows: Array<{ product_id: number; quantity: number }> = []
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]!
      const productId = Number(row.productId)
      const quantity = Number(row.quantity)
      if (!Number.isInteger(productId) || productId <= 0) {
        setError(`Row ${index + 1}: choose a product.`)
        return
      }
      if (!Number.isFinite(quantity) || quantity < 0) {
        setError(`Row ${index + 1}: quantity must be 0 or more.`)
        return
      }
      parsedRows.push({ product_id: productId, quantity })
    }

    setError(null)
    onSubmit(parsedRows)
  }

  function addRow() {
    setRows((prev) => [...prev, createRow((prev[prev.length - 1]?.id ?? 0) + 1, firstProductId)])
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  const fieldClassName =
    'w-full rounded-md border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close inventory action dialog"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <form
        className="relative z-10 w-full max-w-2xl rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-foreground">{TITLES[mode]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{DESCRIPTIONS[mode]}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-6 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {products.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              No products found for this action.
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_140px_auto] items-end gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Product</label>
                  <select
                    value={row.productId}
                    disabled={submitting}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? {
                                ...item,
                                productId: e.target.value,
                              }
                            : item,
                        ),
                      )
                    }
                    className={fieldClassName}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.quantity}
                    disabled={submitting}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item) => (item.id === row.id ? { ...item, quantity: e.target.value } : item)),
                      )
                    }
                    className={fieldClassName}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={submitting || rows.length <= 1}
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove row"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {error ? <p className="mt-3 text-xs font-semibold text-destructive">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="secondary" onClick={addRow} disabled={submitting || products.length === 0}>
            <Plus className="size-4" />
            Add more
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || products.length === 0}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Submit
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
