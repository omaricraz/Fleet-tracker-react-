import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProductResource } from '@/services/api/types'

export interface ProductSearchSelectProps {
  products: ProductResource[]
  loading?: boolean
  error?: boolean
  /** Live filter text (debounced in parent for API search) */
  filter: string
  onFilterChange: (next: string) => void
  /** Called when this row’s search field is focused or the menu opens (parent may route API search here). */
  onFilterFocus?: () => void
  value: number | null
  onChange: (productId: number, product: ProductResource) => void
  disabled?: boolean
  /** Hide products already selected in sibling rows */
  excludeProductIds?: ReadonlySet<number>
}

export function ProductSearchSelect({
  products,
  loading = false,
  error = false,
  filter,
  onFilterChange,
  onFilterFocus,
  value,
  onChange,
  disabled = false,
  excludeProductIds,
}: ProductSearchSelectProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const selected = value != null ? products.find((p) => p.id === value) : undefined

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const visible = products.filter((p) => !excludeProductIds?.has(p.id))

  const onPick = useCallback(
    (p: ProductResource) => {
      onChange(p.id, p)
      setOpen(false)
      onFilterChange('')
    },
    [onChange, onFilterChange],
  )

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={cn(
          'h-9 w-full justify-between rounded-md border-border/60 bg-surface-lowest px-2.5 font-normal',
          !selected && 'text-muted-foreground',
        )}
        onClick={() => {
          setOpen((o) => {
            const next = !o
            if (next) onFilterFocus?.()
            return next
          })
        }}
      >
        <span className="truncate text-left text-sm">{selected ? selected.item : 'Select product…'}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </Button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-md border border-border/60 bg-card shadow-lg"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        >
          <div className="border-b border-border/40 p-2">
            <input
              autoFocus
              value={filter}
              disabled={disabled}
              onFocus={() => onFilterFocus?.()}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Search catalog…"
              className="w-full rounded border border-border/50 bg-surface-lowest px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              aria-autocomplete="list"
              aria-controls={listId}
            />
            {error ? <p className="mt-1 text-xs font-semibold text-destructive">Could not load products.</p> : null}
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto overscroll-contain py-1 text-sm"
            aria-label="Product options"
          >
            {loading ? (
              <li className="flex items-center justify-center gap-2 px-3 py-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading…
              </li>
            ) : visible.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matches. Refine search.</li>
            ) : (
              visible.map((p) => (
                <li key={p.id} role="option" aria-selected={p.id === value}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-surface-low"
                    onClick={() => onPick(p)}
                  >
                    <Check className={cn('size-4 shrink-0', p.id === value ? 'text-primary' : 'text-transparent')} />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{p.item}</span>
                    {p.type ? (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {p.type}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
