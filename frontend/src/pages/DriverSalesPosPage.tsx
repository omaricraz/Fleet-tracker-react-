import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

type PosTab = 'sale' | 'history'

type Product = {
  id: string
  name: string
  price: number
  image: string
  alt: string
}

const PRODUCTS: Product[] = [
  {
    id: 'water',
    name: 'Water 500ml',
    price: 0.5,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCi4zZxX1LAVU-WLYmRKqLyIKsOZAiOswo0cB-THivQEWFbr8fiBa8s0R7ZeGWBC9WbdTfdsRH4RsrxMw_tLY6jFUP8iP1v-f21DuUhXmVC_vlwHVu5Ui-M5DhbN7UrY5cEWdeq5OYYSVwg-yEZA-fRCxMztE5pbYaGyMYbiEGdacy7vxxbCXqfqtoct0WgXk4GMHS211LZMEz68io5RC4Fpm1qZjQobiqoAeG8dLZC_DjzA6ZC679rl7u5Sz8xzrlja5TfdEWdNQEt',
    alt: 'Bottle of mineral water',
  },
  {
    id: 'rice',
    name: 'Rice 25kg',
    price: 24,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC0YLLgkxdZeNuwd0OJV1qWbHezOsKqm3TEZ6MJoG8x5X5HJ2xwCffWAMaExDxgd3RhLJE3-Uy07jDk5lZoqiW8vLb8Y6IfzBEdACKEJ434xgW0MhZb4FMRvQZXKpq7foQ_d8lukVrApor9lGKiXOO4UjNqC1l_6jAwi86INl48V6TWjujOIsGZyGVKloHB9UwhZtcBFrOgyF4-SZXe-iiy_tbsbzbyLOz6Ke3jYb7-26OEcAu7D-Y7BsCOGoHYCE7kzEaSiLiOTXEa',
    alt: 'Sack of rice',
  },
  {
    id: 'juice',
    name: 'Juice Box',
    price: 12.5,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC2eOjFYl8gT0OzcQ-FD8w0LXdNxHIaBc9mO-OSr3ifdNcGakksZJfU6EN2V1aqll7cLCnpV6fSZ1sOJ-4oe1NHLP_qCsI6MQGxaO9OxGjiVNJn5zDQ6eFax9_E_FO5bgK9ipGGMPtACiWdC3U2VA-DO-1JUMCal-V4p-nDJEF9vGCI0xrFkvyzJZaUmWFn4QetVMavdhCJc9v6wXKNvByH6y0YJME7KS37e03v3Ytynq80yPdkUtNSuBtOTZTxMLD6EVX7JXXQs0Dn',
    alt: 'Juice cartons',
  },
  {
    id: 'oil',
    name: 'Cooking Oil',
    price: 8.2,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCQjj8Hv_0XrARep5z8xwMjgKcAX6wsmGcwaR-W16rG8x9kxIq2L9IUzi5ICx2E8urBNE1RJS0VgKm8Ihon-H9FNnRaVfFSCfw2Fyc_acHqtfCeYO-mtgDu-ewO8oP6zUz8FX2gG8PpwZGZCgrdr5SG-AWWsnehMe6c1BQGFGdfMjEMK2IG3be802OmhekPXfZLVXFMGDTC3GBqaSsGVyDBYfHrZf4QSMU6tpXZFZzoVxctCFOQuB48kt4qqPTaSZ6IPmee-aZj5SM1',
    alt: 'Cooking oil jug',
  },
]

const INITIAL_QTY: Record<string, number> = {
  water: 12,
  rice: 0,
  juice: 3,
  oil: 1,
}

const HISTORY_ROWS = [
  {
    time: '10:45 AM',
    shop: 'Barwaaqo Shop',
    detail: 'PAID • RECEIPT #8841',
    total: 450.0,
    status: 'SYNCED' as const,
  },
  {
    time: '09:12 AM',
    shop: 'Zamzam Store',
    detail: 'PAID • RECEIPT #8830',
    total: 43.5,
    status: 'SYNCED' as const,
  },
  {
    time: 'Yesterday',
    shop: 'Central Wholesale',
    detail: 'PENDING SYNC',
    total: 1200.0,
    status: 'PENDING' as const,
  },
]

export function DriverSalesPosPage() {
  const [tab, setTab] = useState<PosTab>('sale')
  const [qtyById, setQtyById] = useState(INITIAL_QTY)

  const { itemCount, subtotal } = useMemo(() => {
    let items = 0
    let sum = 0
    for (const p of PRODUCTS) {
      const q = qtyById[p.id] ?? 0
      items += q
      sum += q * p.price
    }
    return { itemCount: items, subtotal: sum }
  }, [qtyById])

  function setQty(id: string, next: number) {
    setQtyById((prev) => ({ ...prev, [id]: Math.max(0, next) }))
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
                #1042 - Hargeisa East
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
                    <h3 className="font-bold text-primary dark:text-primary-foreground">Zamzam Store</h3>
                    <p className="text-xs text-muted-foreground">34 Airport Road, Hargeisa</p>
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
                {PRODUCTS.map((p) => {
                  const q = qtyById[p.id] ?? 0
                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col items-center overflow-hidden rounded-xl bg-surface-lowest p-4 text-center shadow-[var(--shadow-soft)] dark:bg-card"
                    >
                      <div className="absolute top-0 left-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="mb-3 size-20 overflow-hidden rounded-lg">
                        <img
                          alt={p.alt}
                          className="size-full object-cover"
                          src={p.image}
                          loading="lazy"
                        />
                      </div>
                      <h4 className="mb-1 text-sm font-bold text-foreground">{p.name}</h4>
                      <p className="mb-3 text-xs font-semibold text-primary dark:text-primary-foreground">
                        ${p.price.toFixed(2)}
                      </p>
                      <div className="flex w-full items-center justify-between rounded-lg bg-surface-low p-1 dark:bg-muted">
                        <button
                          type="button"
                          aria-label={`Decrease ${p.name}`}
                          className="flex size-8 items-center justify-center rounded-md bg-surface-lowest text-primary transition-transform active:scale-90 dark:bg-card"
                          onClick={() => setQty(p.id, q - 1)}
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="mx-2 text-sm font-bold tabular-nums">{q}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${p.name}`}
                          className={cn(
                            'flex size-8 items-center justify-center rounded-md text-primary-foreground transition-transform active:scale-90',
                            q > 0 ? 'bg-primary' : 'bg-surface-lowest dark:bg-card',
                          )}
                          onClick={() => setQty(p.id, q + 1)}
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
                })}
              </div>
            </section>

            <section className="pb-12 opacity-40 select-none">
              <h2 className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Recent History
              </h2>
              <div className="mb-3 flex items-center justify-between rounded-xl border-l-4 border-primary bg-surface-lowest p-4 dark:bg-card">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-primary dark:text-primary-foreground">10:45 AM</div>
                  <div>
                    <div className="font-bold">Barwaaqo Shop</div>
                    <div className="text-[10px] text-muted-foreground">PAID • RECEIPT #8841</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary dark:text-primary-foreground">$450.00</div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">SYNCED</div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-3 pb-12">
            <h2 className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Sale History
            </h2>
            {HISTORY_ROWS.map((row) => (
              <div
                key={`${row.time}-${row.shop}`}
                className="flex items-center justify-between rounded-xl border-l-4 border-primary bg-surface-lowest p-4 dark:bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="font-bold text-primary dark:text-primary-foreground">{row.time}</div>
                  <div>
                    <div className="font-bold">{row.shop}</div>
                    <div className="text-[10px] text-muted-foreground">{row.detail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary dark:text-primary-foreground">
                    ${row.total.toFixed(2)}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-bold',
                      row.status === 'SYNCED'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {row.status}
                  </div>
                </div>
              </div>
            ))}
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
              className="flex items-center gap-2 rounded-xl bg-primary-fixed px-6 py-3 font-bold text-accent-foreground transition-all active:scale-95 dark:bg-primary-foreground dark:text-primary"
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
