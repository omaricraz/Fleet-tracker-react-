import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'
import { ApiError } from '@/services/api/client'
import type { DriverInventoryData } from '@/services/api/types'
import {
  postCloseCount,
  postInventoryAdjustment,
  postInventoryLoad,
  postInventoryReturn,
  postOpeningBalance,
} from '@/services/api/inventory'
import { ClosingCountAuditTable } from './ClosingCountAuditTable'
import { mergeLoadAdditionsBatch, clearLoadAdditions, readLoadAdditionsMap } from './loadAdditionsStorage'
import { OperationalDrawerShell } from './OperationalDrawerShell'
import { readOpeningSnapshot, writeOpeningSnapshot, clearOpeningSnapshot } from './openingSnapshotStorage'
import { RepeatableInventoryLinesEditor } from './RepeatableInventoryLinesEditor'
import type { ClosingCountLineState, InventoryFormLine } from './types'
import { useInventoryProductPicker } from './useInventoryProductPicker'

function newRowId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function parseNonNegativeQty(raw: string): number | null {
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

/** Return lines require strictly positive quantities per API. */
function parsePositiveQty(raw: string): number | null {
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/** Laravel-style validation often returns errors.trip_id when no active trip is linked. */
function toastMessageForInventoryMutationError(e: unknown, fallback: string): string {
  if (!(e instanceof ApiError)) return fallback
  if (e.errors.trip_id?.length) return 'Trip is not active. Create a trip.'
  return e.message
}

function initialLines(): InventoryFormLine[] {
  return [{ rowId: newRowId(), productId: null, quantity: '' }]
}

function initialAdjustmentLines(): InventoryFormLine[] {
  return [{ rowId: newRowId(), productId: null, quantity: '', adjustmentMode: 'increase' }]
}

function initClosingState(carId: number, tripId: number | null): {
  lines: ClosingCountLineState[]
  missingBaseline: boolean
} {
  const snap = readOpeningSnapshot(carId, tripId)
  if (!snap || snap.lines.length === 0) {
    return { lines: [], missingBaseline: true }
  }

  const loadMap = readLoadAdditionsMap(carId, tripId)
  const openingIds = new Set(snap.lines.map((l) => l.product_id))

  const lines: ClosingCountLineState[] = snap.lines.map((l) => {
    const loaded = loadMap.get(l.product_id)?.quantity ?? 0
    const baseline = l.opening_qty + loaded
    return {
      product_id: l.product_id,
      product_name: l.product_name,
      opening_qty: l.opening_qty,
      loaded_qty: loaded,
      closing_qty: String(baseline),
    }
  })

  for (const [pid, info] of loadMap) {
    if (openingIds.has(pid)) continue
    const baseline = info.quantity
    lines.push({
      product_id: pid,
      product_name: info.product_name,
      opening_qty: 0,
      loaded_qty: info.quantity,
      closing_qty: String(baseline),
    })
  }

  lines.sort((a, b) => a.product_id - b.product_id)

  return { missingBaseline: false, lines }
}

interface LoadInventoryMutatePayload {
  items: { product_id: number; quantity: number }[]
  batchLines: Array<{ product_id: number; product_name: string; quantity: number }>
}

interface OpeningCountMutatePayload {
  items: { product_id: number; actual_quantity: number }[]
  snapshotLines: Array<{ product_id: number; product_name: string; opening_qty: number }>
}

export interface VehicleInventoryDrawerSharedProps {
  open: boolean
  onClose: () => void
  carId: number
  tripId: number | null
}

export interface VehicleInventoryReturnDrawerProps extends VehicleInventoryDrawerSharedProps {
  /** Current on-hand lines from GET `/cars/{id}/inventory` — drives the fixed return list. */
  snapshot: DriverInventoryData['snapshot']
}

export function VehicleOpeningCountDrawer({
  open,
  onClose,
  carId,
  tripId,
}: VehicleInventoryDrawerSharedProps) {
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const picker = useInventoryProductPicker()
  const { setRowFilters } = picker
  const [rows, setRows] = useState<InventoryFormLine[]>(initialLines)
  const [formError, setFormError] = useState<string | null>(null)

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { rowId: newRowId(), productId: null, quantity: '' }])
  }, [])

  const removeRow = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        const next = prev.filter((r) => r.rowId !== rowId)
        picker.resetRowFilter(rowId)
        return next.length ? next : [{ rowId: newRowId(), productId: null, quantity: '' }]
      })
    },
    [picker],
  )

  const changeRow = useCallback(
    (rowId: string, patch: Partial<Pick<InventoryFormLine, 'productId' | 'productLabel' | 'quantity' | 'adjustmentMode'>>) => {
      setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
    },
    [],
  )

  const setFilter = useCallback(
    (rowId: string, next: string) => {
      setRowFilters((prev) => ({ ...prev, [rowId]: next }))
    },
    [setRowFilters],
  )

  const mutation = useMutation({
    mutationFn: (payload: OpeningCountMutatePayload) =>
      postOpeningBalance({
        trip_id: tripId,
        items: payload.items.map((i) => ({
          car_id: carId,
          product_id: i.product_id,
          actual_quantity: i.actual_quantity,
        })),
      }).then(() => payload.snapshotLines),
    onSuccess: (snapshotLines) => {
      clearLoadAdditions(carId, tripId)
      writeOpeningSnapshot({
        saved_at: new Date().toISOString(),
        car_id: carId,
        trip_id: tripId,
        lines: snapshotLines,
      })
      void qc.invalidateQueries({ queryKey: ['car-inventory', String(carId)] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Opening count recorded.')
      onClose()
    },
    onError: (e: unknown) => {
      pushToast('error', toastMessageForInventoryMutationError(e, 'Opening count failed.'))
    },
  })

  function handleSubmit() {
    setFormError(null)
    const items: { product_id: number; actual_quantity: number }[] = []
    for (const r of rows) {
      if (r.productId == null) continue
      const q = parseNonNegativeQty(r.quantity)
      if (q == null) {
        setFormError('Each line needs a valid quantity (0 or greater).')
        return
      }
      items.push({ product_id: r.productId, actual_quantity: q })
    }
    if (items.length === 0) {
      setFormError('Add at least one product with a quantity.')
      return
    }
    const snapshotLines = items.map((i) => ({
      product_id: i.product_id,
      product_name: rows.find((r) => r.productId === i.product_id)?.productLabel ?? `Product #${i.product_id}`,
      opening_qty: i.actual_quantity,
    }))
    mutation.mutate({ items, snapshotLines })
  }

  const busy = mutation.isPending
  const tripHint =
    tripId != null
      ? `Links to active trip #${tripId} when provided to the API.`
      : 'No active trip — quantities apply to the vehicle only (trip omitted).'

  return (
    <OperationalDrawerShell
      open={open}
      title="Opening count"
      subtitle={tripHint}
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={busy} className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || picker.catalogLoading} className="w-full sm:w-auto" onClick={handleSubmit}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Save opening snapshot
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-border/40 bg-surface-low/30 p-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary">Instructions</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Capture starting on-hand by product. Saved lines become the reconciliation baseline for closing count on this vehicle
            {tripId != null ? ' and trip' : ''}.
          </p>
        </section>

        {picker.catalogError ? (
          <p className="text-sm font-semibold text-destructive">Product catalog failed to load. Retry opening this panel.</p>
        ) : null}

        {formError ? <p className="text-sm font-semibold text-destructive">{formError}</p> : null}

        <RepeatableInventoryLinesEditor
          rows={rows}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onChangeRow={changeRow}
          filters={picker.rowFilters}
          onFilterChange={setFilter}
          getProductsForRow={picker.getProductsForRow}
          getProductsLoading={picker.getProductsLoading}
          getProductsError={picker.getProductsError}
          onRowSearchActivate={picker.setActiveRowId}
          disabled={busy || picker.catalogLoading}
        />
      </div>
    </OperationalDrawerShell>
  )
}

export function VehicleLoadInventoryDrawer({ open, onClose, carId, tripId }: VehicleInventoryDrawerSharedProps) {
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const picker = useInventoryProductPicker()
  const { setRowFilters } = picker
  const [rows, setRows] = useState<InventoryFormLine[]>(initialLines)
  const [formError, setFormError] = useState<string | null>(null)

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { rowId: newRowId(), productId: null, quantity: '' }])
  }, [])

  const removeRow = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        const next = prev.filter((r) => r.rowId !== rowId)
        picker.resetRowFilter(rowId)
        return next.length ? next : [{ rowId: newRowId(), productId: null, quantity: '' }]
      })
    },
    [picker],
  )

  const changeRow = useCallback(
    (rowId: string, patch: Partial<Pick<InventoryFormLine, 'productId' | 'productLabel' | 'quantity' | 'adjustmentMode'>>) => {
      setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
    },
    [],
  )

  const setFilter = useCallback(
    (rowId: string, next: string) => {
      setRowFilters((prev) => ({ ...prev, [rowId]: next }))
    },
    [setRowFilters],
  )

  const mutation = useMutation({
    mutationFn: async (payload: LoadInventoryMutatePayload) => {
      await postInventoryLoad({
        cars: [
          {
            car_id: carId,
            trip_id: tripId ?? undefined,
            items: payload.items,
          },
        ],
      })
      mergeLoadAdditionsBatch(carId, tripId, payload.batchLines)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['car-inventory', String(carId)] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Inventory load posted.')
      onClose()
    },
    onError: (e: unknown) => {
      pushToast('error', toastMessageForInventoryMutationError(e, 'Load inventory failed.'))
    },
  })

  function handleSubmit() {
    setFormError(null)
    const items: { product_id: number; quantity: number }[] = []
    for (const r of rows) {
      if (r.productId == null) continue
      const q = parseNonNegativeQty(r.quantity)
      if (q == null) {
        setFormError('Each line needs a valid quantity (0 or greater).')
        return
      }
      items.push({ product_id: r.productId, quantity: q })
    }
    if (items.length === 0) {
      setFormError('Add at least one product with a quantity.')
      return
    }
    const batchLines = items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      product_name: rows.find((r) => r.productId === i.product_id)?.productLabel ?? `Product #${i.product_id}`,
    }))
    mutation.mutate({ items, batchLines })
  }

  const busy = mutation.isPending

  return (
    <OperationalDrawerShell
      open={open}
      title="Load inventory"
      subtitle="Add stock transfers or replenishment lines for this vehicle. Sent as POST /inventory/load."
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={busy} className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || picker.catalogLoading} className="w-full sm:w-auto" onClick={handleSubmit}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Post load
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {picker.catalogError ? (
          <p className="text-sm font-semibold text-destructive">Product catalog failed to load.</p>
        ) : null}
        {formError ? <p className="text-sm font-semibold text-destructive">{formError}</p> : null}
        <RepeatableInventoryLinesEditor
          rows={rows}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onChangeRow={changeRow}
          filters={picker.rowFilters}
          onFilterChange={setFilter}
          getProductsForRow={picker.getProductsForRow}
          getProductsLoading={picker.getProductsLoading}
          getProductsError={picker.getProductsError}
          onRowSearchActivate={picker.setActiveRowId}
          disabled={busy || picker.catalogLoading}
        />
      </div>
    </OperationalDrawerShell>
  )
}

export function VehicleClosingCountDrawer({ open, onClose, carId, tripId }: VehicleInventoryDrawerSharedProps) {
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const [{ lines, missingBaseline }, setClosingData] = useState(() => initClosingState(carId, tripId))
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (items: { product_id: number; actual_quantity: number }[]) =>
      postCloseCount({ trip_id: tripId, car_id: carId, items }),
    onSuccess: () => {
      clearLoadAdditions(carId, tripId)
      clearOpeningSnapshot(carId, tripId)
      void qc.invalidateQueries({ queryKey: ['car-inventory', String(carId)] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Close count submitted.')
      onClose()
    },
    onError: (e: unknown) => {
      pushToast('error', toastMessageForInventoryMutationError(e, 'Close count failed.'))
    },
  })

  const onClosingChange = useCallback((productId: number, closingQty: string) => {
    setClosingData((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.product_id === productId ? { ...l, closing_qty: closingQty } : l)),
    }))
  }, [])

  function handleSubmit() {
    setFormError(null)
    if (missingBaseline || lines.length === 0) {
      setFormError('Complete an opening count first to establish the audit baseline.')
      return
    }
    const items: { product_id: number; actual_quantity: number }[] = []
    for (const l of lines) {
      const q = parseNonNegativeQty(l.closing_qty)
      if (q == null) {
        setFormError('Enter valid closing quantities (0 or greater).')
        return
      }
      items.push({ product_id: l.product_id, actual_quantity: q })
    }
    mutation.mutate(items)
  }

  const busy = mutation.isPending

  return (
    <OperationalDrawerShell
      open={open}
      title="Closing count"
      subtitle="Reconcile against opening count plus any loads recorded from this page. Variance (Δ) compares closing to open + load. Loaded-only SKUs appear with a Load line badge."
      onClose={onClose}
      busy={busy}
      size="xl"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={busy} className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || missingBaseline || lines.length === 0}
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Submit close count
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {missingBaseline ? (
          <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 dark:bg-amber-400/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">
              No opening baseline
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-amber-950/80 dark:text-amber-100/90">
              Run <strong>Opening count</strong> for this vehicle
              {tripId != null ? ' and active trip' : ''} first. Closing count rows are fixed to match that snapshot.
            </p>
          </section>
        ) : (
          <section className="rounded-lg border border-border/40 bg-surface-low/30 p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Audit</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Edit closing quantities only. Extra products added via <strong>Load inventory</strong> appear here even if they were not on the opening count. Δ = closing − (opening + loaded).
            </p>
          </section>
        )}

        {formError ? <p className="text-sm font-semibold text-destructive">{formError}</p> : null}

        {!missingBaseline && lines.length > 0 ? (
          <ClosingCountAuditTable lines={lines} onClosingChange={onClosingChange} disabled={busy} />
        ) : null}
      </div>
    </OperationalDrawerShell>
  )
}

const notesFieldClass =
  'min-h-[100px] w-full rounded-md border border-border/60 bg-surface-lowest px-2.5 py-2 text-sm leading-relaxed outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60'

const returnQtyInputClass =
  'h-9 w-full rounded-md border border-border/60 bg-surface-lowest px-2.5 text-sm tabular-nums outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60'

function emptyReturnQtyMap(snapshot: DriverInventoryData['snapshot']): Record<number, string> {
  const m: Record<number, string> = {}
  for (const s of snapshot) m[s.product_id] = ''
  return m
}

export function VehicleInventoryReturnDrawer({
  open,
  onClose,
  carId,
  tripId,
  snapshot,
}: VehicleInventoryReturnDrawerProps) {
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const [returnQtyByProductId, setReturnQtyByProductId] = useState(() => emptyReturnQtyMap(snapshot))
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: { notes: string; items: { product_id: number; quantity: number }[] }) =>
      postInventoryReturn({
        notes: payload.notes,
        cars: [
          {
            car_id: carId,
            trip_id: tripId ?? undefined,
            items: payload.items,
          },
        ],
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['car-inventory', String(carId)] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Return submitted.')
      onClose()
    },
    onError: (e: unknown) => {
      pushToast('error', toastMessageForInventoryMutationError(e, 'Return failed.'))
    },
  })

  function setReturnQty(productId: number, raw: string) {
    setReturnQtyByProductId((prev) => ({ ...prev, [productId]: raw }))
  }

  function handleSubmit() {
    setFormError(null)
    const trimmedNotes = notes.trim()
    if (trimmedNotes.length < 1) {
      setFormError('Notes are required (1–2000 characters).')
      return
    }
    if (trimmedNotes.length > 2000) {
      setFormError('Notes must be at most 2000 characters.')
      return
    }
    if (snapshot.length === 0) {
      setFormError('There are no products on hand to return.')
      return
    }
    const items: { product_id: number; quantity: number }[] = []
    for (const s of snapshot) {
      const raw = returnQtyByProductId[s.product_id] ?? ''
      const q = parsePositiveQty(raw)
      if (q == null) continue
      items.push({ product_id: s.product_id, quantity: q })
    }
    if (items.length === 0) {
      setFormError('Enter a return quantity greater than zero for at least one product.')
      return
    }
    mutation.mutate({ notes: trimmedNotes, items })
  }

  const busy = mutation.isPending
  const tripHint =
    tripId != null
      ? `Posted with car and active trip #${tripId} when the API accepts trip scope.`
      : 'No active trip — return applies to the vehicle only (trip omitted).'

  return (
    <OperationalDrawerShell
      open={open}
      title="Inventory return"
      subtitle={`Warehouse or depot return from current on-hand. ${tripHint} Notes are required.`}
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={busy} className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || snapshot.length === 0}
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Submit return
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {formError ? <p className="text-sm font-semibold text-destructive">{formError}</p> : null}

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="inventory-return-notes">
            Notes
          </label>
          <textarea
            id="inventory-return-notes"
            className={notesFieldClass}
            disabled={busy}
            placeholder="Reason, receiving location, reference #…"
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">{notes.trim().length} / 2000 · minimum 1 character</p>
        </div>

        {snapshot.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products on this vehicle — nothing to return.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <div className="grid grid-cols-1 gap-px bg-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:grid-cols-[minmax(0,1fr)_5rem_6.5rem]">
              <div className="bg-surface-low px-3 py-2">Product</div>
              <div className="bg-surface-low px-2 py-2 text-right">On hand</div>
              <div className="bg-surface-low px-2 py-2 text-right">Return qty</div>
            </div>
            <ul className="divide-y divide-border/40 bg-surface-lowest/40">
              {snapshot.map((s) => (
                <li
                  key={s.product_id}
                  className="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_5rem_6.5rem] sm:items-center sm:gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug text-foreground">{s.product_name}</p>
                    <p className="text-[10px] font-medium tabular-nums text-muted-foreground">SKU #{s.product_id}</p>
                  </div>
                  <div className="flex flex-col gap-1 sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">
                      On hand
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">{s.quantity}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">
                      Return qty
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={busy}
                      value={returnQtyByProductId[s.product_id] ?? ''}
                      onChange={(e) => setReturnQty(s.product_id, e.target.value)}
                      className={returnQtyInputClass}
                      placeholder="—"
                      aria-label={`Return quantity for ${s.product_name}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </OperationalDrawerShell>
  )
}

export function VehicleInventoryAdjustmentDrawer({ open, onClose, carId, tripId }: VehicleInventoryDrawerSharedProps) {
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const picker = useInventoryProductPicker()
  const { setRowFilters } = picker
  const [rows, setRows] = useState<InventoryFormLine[]>(initialAdjustmentLines)
  const [formError, setFormError] = useState<string | null>(null)

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { rowId: newRowId(), productId: null, quantity: '', adjustmentMode: 'increase' }])
  }, [])

  const removeRow = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        const next = prev.filter((r) => r.rowId !== rowId)
        picker.resetRowFilter(rowId)
        return next.length
          ? next
          : [{ rowId: newRowId(), productId: null, quantity: '', adjustmentMode: 'increase' }]
      })
    },
    [picker],
  )

  const changeRow = useCallback(
    (rowId: string, patch: Partial<Pick<InventoryFormLine, 'productId' | 'productLabel' | 'quantity' | 'adjustmentMode'>>) => {
      setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
    },
    [],
  )

  const setFilter = useCallback(
    (rowId: string, next: string) => {
      setRowFilters((prev) => ({ ...prev, [rowId]: next }))
    },
    [setRowFilters],
  )

  const mutation = useMutation({
    mutationFn: (items: { product_id: number; mode: 'increase' | 'decrease'; quantity: number }[]) =>
      postInventoryAdjustment({ car_id: carId, trip_id: tripId, items }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['car-inventory', String(carId)] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Adjustment applied.')
      onClose()
    },
    onError: (e: unknown) => {
      pushToast('error', toastMessageForInventoryMutationError(e, 'Adjustment failed.'))
    },
  })

  function handleSubmit() {
    setFormError(null)
    const items: { product_id: number; mode: 'increase' | 'decrease'; quantity: number }[] = []
    for (const r of rows) {
      if (r.productId == null) continue
      const q = parsePositiveQty(r.quantity)
      if (q == null) {
        setFormError('Each line with a product needs a quantity greater than zero.')
        return
      }
      const mode = r.adjustmentMode ?? 'increase'
      items.push({ product_id: r.productId, mode, quantity: q })
    }
    if (items.length === 0) {
      setFormError('Add at least one product with a quantity greater than zero.')
      return
    }
    mutation.mutate(items)
  }

  const busy = mutation.isPending

  return (
    <OperationalDrawerShell
      open={open}
      title="Inventory adjustment"
      subtitle="Same line layout as load inventory: choose a product, set increase or decrease, then quantity to apply. Posted as POST /inventory/adjustment."
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={busy} className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || picker.catalogLoading} className="w-full sm:w-auto" onClick={handleSubmit}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Apply adjustment
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {picker.catalogError ? (
          <p className="text-sm font-semibold text-destructive">Product catalog failed to load. Retry opening this panel.</p>
        ) : null}
        {formError ? <p className="text-sm font-semibold text-destructive">{formError}</p> : null}

        <RepeatableInventoryLinesEditor
          variant="adjustment"
          rows={rows}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onChangeRow={changeRow}
          filters={picker.rowFilters}
          onFilterChange={setFilter}
          getProductsForRow={picker.getProductsForRow}
          getProductsLoading={picker.getProductsLoading}
          getProductsError={picker.getProductsError}
          onRowSearchActivate={picker.setActiveRowId}
          disabled={busy || picker.catalogLoading}
        />
      </div>
    </OperationalDrawerShell>
  )
}
