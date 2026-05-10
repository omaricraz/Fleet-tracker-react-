import { Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'

type ProductRow = {
  id: number
  label: string
}

interface CloseCountModalProps {
  open: boolean
  products: ProductRow[]
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: Array<{ product_id: number; actual_quantity: number }>) => void
}

export function CloseCountModal({
  open,
  products,
  submitting = false,
  onClose,
  onSubmit,
}: CloseCountModalProps) {
  const [qtyByProduct, setQtyByProduct] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const productIds = useMemo(() => products.map((p) => p.id), [products])

  useEffect(() => {
    if (!open) {
      setQtyByProduct({})
      setError(null)
      return
    }
    setQtyByProduct((prev) => {
      const next: Record<number, string> = {}
      for (const id of productIds) next[id] = prev[id] ?? '0'
      return next
    })
  }, [open, productIds])

  if (!open) return null

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const items: Array<{ product_id: number; actual_quantity: number }> = []
    for (const product of products) {
      const raw = (qtyByProduct[product.id] ?? '').trim()
      if (raw.length === 0) {
        setError(`Enter close count for "${product.label}".`)
        return
      }
      const parsed = Number(raw)
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError(`Close count for "${product.label}" must be 0 or more.`)
        return
      }
      items.push({ product_id: product.id, actual_quantity: parsed })
    }
    setError(null)
    onSubmit(items)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close close count dialog"
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
            <h2 className="text-lg font-black text-foreground">Close count</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit closing inventory for all products before ending the trip.
            </p>
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
              No products found to close count.
            </p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[1fr_140px] items-center gap-3 rounded-md border border-border/50 p-3"
              >
                <label htmlFor={`close-count-${product.id}`} className="text-sm font-semibold text-foreground">
                  {product.label}
                </label>
                <input
                  id={`close-count-${product.id}`}
                  type="number"
                  min="0"
                  step="1"
                  value={qtyByProduct[product.id] ?? '0'}
                  disabled={submitting}
                  onChange={(e) =>
                    setQtyByProduct((prev) => ({
                      ...prev,
                      [product.id]: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
              </div>
            ))
          )}
        </div>

        {error ? <p className="mt-3 text-xs font-semibold text-destructive">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || products.length === 0}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Submit close count
          </Button>
        </div>
      </form>
    </div>
  )
}
