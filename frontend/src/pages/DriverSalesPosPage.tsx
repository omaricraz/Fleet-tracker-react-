import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useToast } from '@/components/providers/toast-provider'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api/client'
import { listCustomers } from '@/services/api/customers'
import { listDrivers } from '@/services/api/drivers'
import { listProducts } from '@/services/api/products'
import { createSale, getMySales } from '@/services/api/sales'
import { listTrips } from '@/services/api/trips'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#e5e7eb" width="80" height="80"/><text x="40" y="44" text-anchor="middle" fill="#64748b" font-size="10">SKU</text></svg>',
  )

type PosTab = 'sale' | 'history'

export function DriverSalesPosPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<PosTab>('sale')
  const [qtyById, setQtyById] = useState<Record<string, number>>({})

  const { data: driverId } = useQuery({
    queryKey: ['driver-scope', user?.name],
    queryFn: async () => {
      if (!user?.name) return null
      const { items } = await listDrivers({ per_page: 100, search: user.name })
      const match = items.find((d) => d.full_name.trim() === user.name.trim())
      return match?.id ?? null
    },
    enabled: Boolean(user?.name),
  })

  const { data: trips = [] } = useQuery({
    queryKey: ['trips', 'pos-active', driverId],
    queryFn: () => listTrips({ status: 'active', driver_id: driverId ?? undefined }),
    enabled: driverId != null,
  })

  const activeTrip = trips[0] ?? null
  const activeTripId = activeTrip && typeof activeTrip.id === 'number' ? activeTrip.id : null

  const { data: productsPage, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'pos'],
    queryFn: () => listProducts({ per_page: 100, sort: 'item', direction: 'asc' }),
  })
  const products = productsPage?.items ?? []

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

  const { data: customersPage } = useQuery({
    queryKey: ['customers', 'pos'],
    queryFn: () => listCustomers({ per_page: 50, sort: 'full_name', direction: 'asc' }),
  })
  const customers = customersPage?.items ?? []
  const customerId = customers[0]?.id ?? null

  const { data: mySales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', 'my'],
    queryFn: getMySales,
  })

  const saleMut = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sales', 'my'] })
      void qc.invalidateQueries({ queryKey: ['trips'] })
    },
  })

  const { itemCount, subtotal } = useMemo(() => {
    let items = 0
    let sum = 0
    for (const p of products) {
      const k = String(p.id)
      const q = qtyById[k] ?? 0
      const price = Number(p.price) || 0
      items += q
      sum += q * price
    }
    return { itemCount: items, subtotal: sum }
  }, [qtyById, products])

  function setQty(id: string, next: number) {
    setQtyById((prev) => ({ ...prev, [id]: Math.max(0, next) }))
  }

  async function recordSales() {
    if (activeTripId == null) {
      pushToast('error', 'You need an active trip to record sales.')
      return
    }
    if (customerId == null) {
      pushToast('error', 'Add a customer in resource management first.')
      return
    }
    const lines = products.filter((p) => (qtyById[String(p.id)] ?? 0) > 0)
    if (lines.length === 0) {
      pushToast('error', 'Select quantities for at least one product.')
      return
    }
    try {
      for (const p of lines) {
        const qty = qtyById[String(p.id)] ?? 0
        const unit = Number(p.price) || 0
        await saleMut.mutateAsync({
          trip_id: activeTripId,
          product_id: p.id,
          customer_id: customerId,
          quantity: qty,
          total_price: unit * qty,
        })
      }
      pushToast('success', 'Sale recorded.')
      setQtyById((prev) => {
        const next = { ...prev }
        for (const p of products) next[String(p.id)] = 0
        return next
      })
    } catch (e) {
      pushToast('error', e instanceof ApiError ? e.message : 'Sale could not be saved.')
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
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase dark:text-[#afc8ed]/80">
                Active Trip
              </p>
              <p className="text-xs font-semibold text-primary dark:text-[#d3e4ff]">
                {activeTripId != null
                  ? `Trip #${activeTripId}${customers[0]?.full_name ? ` · ${customers[0].full_name}` : ''}`
                  : 'No active trip'}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-fixed bg-surface-high dark:border-[#d3e4ff]/50">
              <img
                alt=""
                className="size-full object-cover"
                decoding="async"
                src={DRIVER_AVATAR}
                width={40}
                height={40}
              />
            </div>
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
            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Current Stop
                </h2>
                <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  Route Optimized
                </span>
              </div>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-lowest p-4 text-left shadow-[var(--shadow-soft)] transition-all active:scale-[0.98] dark:bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-surface-high dark:bg-muted">
                    <span className="material-symbols-outlined text-primary dark:text-primary-foreground">
                      storefront
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary dark:text-primary-foreground">
                      {customers[0]?.full_name ?? 'Select customers in resources'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {customers[0]?.phone ?? '—'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[var(--outline-variant)]">expand_more</span>
              </button>
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
                  <p className="col-span-2 text-center text-sm text-muted-foreground">No products in tenant.</p>
                ) : (
                  products.map((p) => {
                    const id = String(p.id)
                    const q = qtyById[id] ?? 0
                    const price = Number(p.price) || 0
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
