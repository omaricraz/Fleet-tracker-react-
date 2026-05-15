import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useToast } from '@/components/providers/toast-provider'
import { useAuth } from '@/features/auth/AuthContext'
import { DriverLogoutButton } from '@/layouts/driver-logout-button'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api/client'
import { listCustomers } from '@/services/api/customers'
import { getDriverInventoryProducts } from '@/services/api/inventory'
import { createSale, getMySales } from '@/services/api/sales'
import type { CustomerResource, SaleRecord } from '@/services/api/types'
import { getDriverCurrentTrip } from '@/services/api/trips'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#e5e7eb" width="80" height="80"/><text x="40" y="44" text-anchor="middle" fill="#64748b" font-size="10">SKU</text></svg>',
  )

type PosTab = 'sale' | 'history'

const NO_TRIP_FOR_SALES_DRIVER_MESSAGE =
  'No trip has been created. Ask your manager to create a trip for you.'

/** Parse catalog unit price safely for money math */
function parseUnitPrice(price: unknown): number {
  if (typeof price === 'number' && Number.isFinite(price)) return price
  if (typeof price === 'string') {
    const n = Number.parseFloat(price)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/** Round to 2 dp (unit × qty) without float drift, e.g. 19.99 × 3 → 59.97 */
function saleLineTotal(unitPrice: number, quantity: number): number {
  if (quantity <= 0 || unitPrice <= 0) return 0
  return Math.round(unitPrice * quantity * 100) / 100
}

function looksLikeNoTripSaleApiError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('no active trip') ||
    (m.includes('open a trip') && m.includes('recording sales')) ||
    (m.includes('trip') && m.includes('before recording sales'))
  )
}

export function DriverSalesPosPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<PosTab>('sale')
  const [qtyById, setQtyById] = useState<Record<string, number>>({})

  const { data: currentTrip, isFetched: currentTripFetched } = useQuery({
    queryKey: ['driver', 'trip', 'current'],
    queryFn: getDriverCurrentTrip,
    enabled: Boolean(user),
  })

  const activeTripId =
    currentTrip && typeof currentTrip.id === 'number' ? currentTrip.id : null

  const { data: inventoryRows = [], isLoading: productsLoading } = useQuery({
    queryKey: ['driver', 'inventory', 'products'],
    queryFn: getDriverInventoryProducts,
    enabled: Boolean(user),
  })

  const products = useMemo(
    () => inventoryRows.map((row) => row.product),
    [inventoryRows],
  )

  const stockByProductId = useMemo(() => {
    const m = new Map<number, number>()
    for (const row of inventoryRows) {
      m.set(row.product.id, row.quantity)
    }
    return m
  }, [inventoryRows])

  useEffect(() => {
    if (products.length === 0) return
    setQtyById((prev) => {
      const next = { ...prev }
      for (const p of products) {
        const k = String(p.id)
        if (next[k] === undefined) next[k] = 0
      }
      return next
    })
  }, [products])

  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [customerSearchInput, setCustomerSearchInput] = useState('')
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResource | null>(null)
  const customerPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedCustomerSearch(customerSearchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [customerSearchInput])

  useEffect(() => {
    if (!customerPickerOpen) return
    function onPointerDown(e: PointerEvent) {
      if (customerPickerRef.current?.contains(e.target as Node)) return
      setCustomerPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [customerPickerOpen])

  useEffect(() => {
    if (!customerPickerOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCustomerPickerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [customerPickerOpen])

  const { data: customersPage, isFetching: customersFetching } = useQuery({
    queryKey: ['customers', 'pos', debouncedCustomerSearch],
    queryFn: () =>
      listCustomers({
        per_page: 100,
        sort: 'full_name',
        direction: 'asc',
        search: debouncedCustomerSearch || undefined,
      }),
    enabled: Boolean(user) && customerPickerOpen,
  })
  const customers = customersPage?.items ?? []
  const customerId = selectedCustomer?.id ?? null

  const { data: mySales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', 'my'],
    queryFn: getMySales,
  })

  const saleMut = useMutation({
    mutationFn: async (payload: {
      trip_id: number
      customer_id: number
      lines: Array<{ product_id: number; quantity: number; total_price: number }>
    }) => {
      const results: SaleRecord[] = []
      for (const line of payload.lines) {
        results.push(
          await createSale({
            trip_id: payload.trip_id,
            customer_id: payload.customer_id,
            product_id: line.product_id,
            quantity: line.quantity,
            total_price: line.total_price,
          }),
        )
      }
      return results
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sales', 'my'] })
      void qc.invalidateQueries({ queryKey: ['driver', 'inventory', 'products'] })
    },
  })

  const { itemCount, subtotal } = useMemo(() => {
    let items = 0
    let sum = 0
    for (const p of products) {
      const k = String(p.id)
      const q = qtyById[k] ?? 0
      if (q <= 0) continue
      const unit = parseUnitPrice(p.price)
      items += q
      sum += saleLineTotal(unit, q)
    }
    return { itemCount: items, subtotal: sum }
  }, [qtyById, products])

  function setQty(id: string, next: number) {
    setQtyById((prev) => ({ ...prev, [id]: Math.max(0, next) }))
  }

  async function recordSales() {
    if (activeTripId == null) {
      pushToast('error', NO_TRIP_FOR_SALES_DRIVER_MESSAGE)
      return
    }
    if (customerId == null) {
      pushToast('error', 'Select a customer before recording the sale.')
      return
    }
    const lines = products.filter((p) => (qtyById[String(p.id)] ?? 0) > 0)
    if (lines.length === 0) {
      pushToast('error', 'Select quantities for at least one product.')
      return
    }
    try {
      const saleLines = lines.map((p) => {
        const qty = qtyById[String(p.id)] ?? 0
        const unit = parseUnitPrice(p.price)
        return {
          product_id: Number(p.id),
          quantity: qty,
          total_price: saleLineTotal(unit, qty),
        }
      })
      await saleMut.mutateAsync({
        trip_id: activeTripId,
        customer_id: customerId,
        lines: saleLines,
      })
      pushToast('success', 'Sale recorded.')
      setQtyById((prev) => {
        const next = { ...prev }
        for (const p of products) next[String(p.id)] = 0
        return next
      })
    } catch (e) {
      if (e instanceof ApiError && looksLikeNoTripSaleApiError(e.message)) {
        pushToast('error', NO_TRIP_FOR_SALES_DRIVER_MESSAGE)
      } else {
        const fallback = e instanceof ApiError ? e.firstFieldError() ?? e.message : 'Sale could not be saved.'
        pushToast('error', fallback)
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-36 text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm dark:border-border/60 dark:bg-[#00172f]">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/driver"
              className="inline-flex active:scale-95"
              aria-label="Back to driver home"
            >
              <span className="material-symbols-outlined text-primary dark:text-[#eff4ff]">
                arrow_back
              </span>
            </Link>
            <h1 className="font-semibold text-lg tracking-tight text-primary dark:text-[#eff4ff]">
              Fleet Sales
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DriverLogoutButton
              iconClassName="dark:text-[#afc8ed]/90"
              className="rounded-full p-1.5 text-muted-foreground hover:text-primary dark:hover:text-[#d3e4ff]"
            />
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase dark:text-[#afc8ed]/80">
                Active Trip
              </p>
              <p className="text-xs font-semibold text-primary dark:text-[#d3e4ff]">
                {activeTripId != null
                  ? `Trip #${activeTripId}${selectedCustomer?.full_name ? ` · ${selectedCustomer.full_name}` : ''}`
                  : 'No trip assigned'}
              </p>
            </div>
            <Link
              to="/driver/profile"
              className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-fixed bg-surface-high dark:border-[#d3e4ff]/50"
              aria-label="Open profile"
            >
              <img
                alt=""
                className="size-full object-cover"
                decoding="async"
                src={DRIVER_AVATAR}
                width={40}
                height={40}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        <nav className="mb-6 flex rounded-xl bg-surface-low p-1 dark:bg-muted">
          <button
            type="button"
            onClick={() => setTab('sale')}
            className={cn(
              'flex-1 rounded-lg py-3 text-sm font-bold transition-colors',
              tab === 'sale'
                ? 'bg-surface-lowest text-primary shadow-sm dark:bg-card dark:text-primary'
                : 'font-medium text-muted-foreground hover:text-primary',
            )}
          >
            New Sale
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={cn(
              'flex-1 rounded-lg py-3 text-sm font-bold transition-colors',
              tab === 'history'
                ? 'bg-surface-lowest text-primary shadow-sm dark:bg-card dark:text-primary'
                : 'font-medium text-muted-foreground hover:text-primary',
            )}
          >
            History
          </button>
        </nav>

        {tab === 'sale' ? (
          <>
            {currentTripFetched && activeTripId == null ? (
              <div
                className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground dark:border-amber-400/30 dark:bg-amber-950/40"
                role="status"
              >
                {NO_TRIP_FOR_SALES_DRIVER_MESSAGE}
              </div>
            ) : null}
            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Customer Selected
                </h2>
                <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  Customer
                </span>
              </div>
              <div ref={customerPickerRef} className="relative">
                <button
                  type="button"
                  aria-expanded={customerPickerOpen}
                  aria-haspopup="listbox"
                  aria-controls="driver-pos-customer-listbox"
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-lowest p-4 text-left shadow-[var(--shadow-soft)] transition-all active:scale-[0.98] dark:bg-card"
                  onClick={() => {
                    setCustomerPickerOpen((o) => {
                      const next = !o
                      if (next) {
                        setCustomerSearchInput('')
                        setDebouncedCustomerSearch('')
                      }
                      return next
                    })
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-high dark:bg-muted">
                      <span className="material-symbols-outlined text-primary dark:text-primary-foreground">
                        storefront
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-primary dark:text-primary-foreground">
                        {selectedCustomer?.full_name ?? 'Choose customer for this sale'}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedCustomer?.phone ?? 'Search or pick from your directory'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'material-symbols-outlined shrink-0 text-[var(--outline-variant)] transition-transform',
                      customerPickerOpen && 'rotate-180',
                    )}
                  >
                    expand_more
                  </span>
                </button>

                {customerPickerOpen ? (
                  <div
                    id="driver-pos-customer-picker"
                    role="presentation"
                    className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-border/60 bg-surface-lowest shadow-[var(--shadow-soft)] dark:border-border/40 dark:bg-card"
                  >
                    <label className="block border-b border-border/40 px-3 pt-3 pb-2 dark:border-border/40">
                      <span className="sr-only">Search customers</span>
                      <div className="flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 dark:bg-muted">
                        <span className="material-symbols-outlined text-lg text-muted-foreground">search</span>
                        <input
                          type="search"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="Type name or phone…"
                          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                          value={customerSearchInput}
                          onChange={(e) => setCustomerSearchInput(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-controls="driver-pos-customer-listbox"
                          aria-autocomplete="list"
                        />
                      </div>
                    </label>

                    <ul
                      id="driver-pos-customer-listbox"
                      role="listbox"
                      aria-label="Customers"
                      className="max-h-56 overflow-y-auto py-1"
                    >
                      {customersFetching ? (
                        <li className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</li>
                      ) : customers.length === 0 ? (
                        <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No customers match. Try another search or add customers in Resources.
                        </li>
                      ) : (
                        customers.map((c) => {
                          const isSelected = selectedCustomer?.id === c.id
                          return (
                            <li key={c.id} role="presentation">
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={cn(
                                  'flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition-colors',
                                  isSelected
                                    ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/15'
                                    : 'hover:bg-surface-low dark:hover:bg-muted',
                                )}
                                onClick={() => {
                                  setSelectedCustomer(c)
                                  setCustomerPickerOpen(false)
                                  setCustomerSearchInput('')
                                }}
                              >
                                <span className="font-bold text-foreground">{c.full_name}</span>
                                <span className="text-xs text-muted-foreground">{c.phone}</span>
                              </button>
                            </li>
                          )
                        })
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Inventory
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-surface-low p-2 text-primary dark:bg-muted"
                    aria-label="Search inventory"
                  >
                    <span className="material-symbols-outlined text-lg">search</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-surface-low p-2 text-primary dark:bg-muted"
                    aria-label="Filter inventory"
                  >
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {productsLoading ? (
                  <p className="col-span-2 text-center text-sm text-muted-foreground">Loading catalog…</p>
                ) : products.length === 0 ? (
                  <p className="col-span-2 text-center text-sm text-muted-foreground">No inventory on this trip.</p>
                ) : (
                  products.map((p) => {
                    const id = String(p.id)
                    const q = qtyById[id] ?? 0
                    const stock = stockByProductId.get(p.id) ?? 0
                    const price = parseUnitPrice(p.price)
                    const name = p.item
                    return (
                      <div
                        key={id}
                        className="group relative flex flex-col items-center overflow-hidden rounded-xl bg-surface-lowest p-4 text-center shadow-[var(--shadow-soft)] dark:bg-card"
                      >
                        <div className="absolute top-0 left-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="mb-3 size-20 overflow-hidden rounded-lg">
                          <img
                            alt={name}
                            className="size-full object-cover"
                            src={PLACEHOLDER}
                            loading="lazy"
                          />
                        </div>
                        <h4 className="mb-1 text-sm font-bold text-foreground">{name}</h4>
                        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                          Stock:{' '}
                          {Number.isInteger(stock) ? stock : stock.toFixed(2)}
                        </p>
                        <p className="mb-3 text-xs font-semibold text-primary dark:text-primary-foreground">
                          ${price.toFixed(2)}
                        </p>
                        <div className="flex w-full items-center justify-between rounded-lg bg-surface-low p-1 dark:bg-muted">
                          <button
                            type="button"
                            aria-label={`Decrease ${name}`}
                            className="flex size-8 items-center justify-center rounded-md bg-surface-lowest text-primary transition-transform active:scale-90 dark:bg-card"
                            onClick={() => setQty(id, q - 1)}
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="mx-2 text-sm font-bold tabular-nums">{q}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${name}`}
                            className={cn(
                              'flex size-8 items-center justify-center rounded-md text-primary-foreground transition-transform active:scale-90',
                              q > 0 ? 'bg-primary' : 'bg-surface-lowest dark:bg-card',
                            )}
                            onClick={() => setQty(id, q + 1)}
                          >
                            <span
                              className={cn(
                                'material-symbols-outlined text-sm',
                                q === 0 && 'text-primary',
                              )}
                            >
                              add
                            </span>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            <section className="pb-12">
              <h2 className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Recent (live)
              </h2>
              {mySales.slice(0, 3).map((s) => {
                const sid = typeof s.id === 'number' ? s.id : Number(s.id)
                const amt = Number.parseFloat(String(s.total_price ?? 0)) || 0
                const t = String(s.created_at ?? '')
                return (
                  <div
                    key={sid}
                    className="mb-3 flex items-center justify-between rounded-xl border-l-4 border-primary bg-surface-lowest p-4 dark:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-primary dark:text-primary-foreground">
                        {t ? new Date(t).toLocaleString() : '—'}
                      </div>
                      <div>
                        <div className="font-bold">Product #{String(s.product_id)}</div>
                        <div className="text-[10px] text-muted-foreground">Qty {String(s.quantity)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary dark:text-primary-foreground">
                        ${amt.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        SYNCED
                      </div>
                    </div>
                  </div>
                )
              })}
            </section>
          </>
        ) : (
          <section className="space-y-3 pb-12">
            <h2 className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Sale History
            </h2>
            {salesLoading ? (
              <p className="text-sm text-muted-foreground">Loading history…</p>
            ) : mySales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              mySales.map((s) => {
                const sid = typeof s.id === 'number' ? s.id : Number(s.id)
                const amt = Number.parseFloat(String(s.total_price ?? 0)) || 0
                const t = String(s.created_at ?? '')
                return (
                  <div
                    key={sid}
                    className="flex items-center justify-between rounded-xl border-l-4 border-primary bg-surface-lowest p-4 dark:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-primary dark:text-primary-foreground">
                        {t ? new Date(t).toLocaleString() : '—'}
                      </div>
                      <div>
                        <div className="font-bold">Product #{String(s.product_id)}</div>
                        <div className="text-[10px] text-muted-foreground">Trip #{String(s.trip_id)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary dark:text-primary-foreground">
                        ${amt.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">SYNCED</div>
                    </div>
                  </div>
                )
              })
            )}
          </section>
        )}
      </main>

      {tab === 'sale' ? (
        <div className="fixed bottom-24 left-4 right-4 z-40">
          <div className="hero-gradient flex items-center justify-between rounded-2xl border border-white/10 p-4 text-primary-foreground shadow-[0px_12px_24px_rgba(0,23,47,0.25)] backdrop-blur-md dark:border-primary-foreground/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-primary-foreground/80 uppercase">
                Current Cart
              </span>
              <span className="text-lg font-bold tabular-nums">
                {itemCount} Items | ${subtotal.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              disabled={saleMut.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary-fixed px-6 py-3 font-bold text-accent-foreground transition-all active:scale-95 disabled:opacity-50 dark:bg-primary-foreground dark:text-primary"
              onClick={() => void recordSales()}
            >
              <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
              Record Sale
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
