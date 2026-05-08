import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

type RequestTab = 'fuel' | 'maintenance'

export function DriverSubmitRequestPage() {
  const [tab, setTab] = useState<RequestTab>('fuel')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <main className="mx-auto max-w-md space-y-8 px-6 pb-36 pt-8">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary dark:text-white">
          New Request
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit fuel or maintenance logs for Asset #8821
        </p>
      </section>

      <div className="mb-6 flex gap-1 rounded-xl bg-surface-low p-1 dark:bg-muted">
        <button
          type="button"
          onClick={() => setTab('fuel')}
          className={
            tab === 'fuel'
              ? 'flex-1 rounded-xl bg-surface-lowest py-3 text-sm font-bold text-primary shadow-sm dark:bg-card'
              : 'flex-1 rounded-xl py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-high dark:hover:bg-muted/80'
          }
        >
          Fuel
        </button>
        <button
          type="button"
          onClick={() => setTab('maintenance')}
          className={
            tab === 'maintenance'
              ? 'flex-1 rounded-xl bg-surface-lowest py-3 text-sm font-bold text-primary shadow-sm dark:bg-card'
              : 'flex-1 rounded-xl py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-high dark:hover:bg-muted/80'
          }
        >
          Maintenance
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {tab === 'fuel' ? (
          <>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-[var(--shadow-soft)] dark:bg-card">
                <label className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Requested Litres
                </label>
                <input
                  aria-label="Requested litres"
                  className="w-full border-0 bg-transparent p-0 text-4xl font-black tracking-tighter text-foreground outline-none placeholder:text-[var(--outline-variant)] focus:ring-0"
                  placeholder="0.00"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  type="number"
                />
              </div>
              <div className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-[var(--shadow-soft)] dark:bg-card">
                <label className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Cost per Litre (USD)
                </label>
                <input
                  aria-label="Cost per litre in USD"
                  className="w-full border-0 bg-transparent p-0 text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-[var(--outline-variant)] focus:ring-0"
                  placeholder="0.000"
                  inputMode="decimal"
                  min={0}
                  step="0.001"
                  type="number"
                />
              </div>
              <div className="space-y-2 rounded-xl border-l-4 border-primary bg-surface-lowest p-4 dark:bg-card">
                <label className="mb-2 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Additional Notes
                </label>
                <textarea
                  className="h-20 w-full resize-none border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-[var(--outline-variant)] focus:ring-0"
                  placeholder="e.g. Full tank at Shell Station #4..."
                  rows={4}
                />
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--outline-variant)] bg-surface-high py-4 font-semibold text-primary transition-all hover:bg-surface-lowest dark:bg-muted dark:hover:bg-card"
              >
                <span className="material-symbols-outlined !text-2xl">photo_camera</span>
                <span>Upload Receipt/Gauge</span>
              </button>
            </div>
            <button
              type="submit"
              className="hero-gradient flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-bold text-primary-foreground shadow-xl transition-all active:scale-[0.98]"
            >
              <span>Submit Fuel Request</span>
              <span className="material-symbols-outlined !text-[1.375rem]">send</span>
            </button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-[var(--shadow-soft)] dark:bg-card">
                <label className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Maintenance Type
                </label>
                <input
                  className="w-full border-0 bg-transparent p-0 text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-[var(--outline-variant)] focus:ring-0"
                  placeholder="e.g. Brake inspection"
                  type="text"
                />
              </div>
              <div className="space-y-2 rounded-xl border-l-4 border-primary bg-surface-lowest p-4 dark:bg-card">
                <label className="mb-2 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Details
                </label>
                <textarea
                  className="h-24 w-full resize-none border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-[var(--outline-variant)] focus:ring-0"
                  placeholder="Describe the issue, parts needed, urgency..."
                  rows={4}
                />
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--outline-variant)] bg-surface-high py-4 font-semibold text-primary transition-all hover:bg-surface-lowest dark:bg-muted dark:hover:bg-card"
              >
                <span className="material-symbols-outlined !text-2xl">photo_camera</span>
                <span>Upload Photos</span>
              </button>
            </div>
            <button
              type="submit"
              className="hero-gradient flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-bold text-primary-foreground shadow-xl transition-all active:scale-[0.98]"
            >
              <span>Submit Maintenance Request</span>
              <span className="material-symbols-outlined !text-[1.375rem]">send</span>
            </button>
          </>
        )}
      </form>

      <section className="pt-4">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
            Recent Requests
          </h2>
          <Link
            className="text-xs font-semibold text-primary underline decoration-primary underline-offset-2"
            to="/request-management"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-lowest p-4 transition-colors hover:bg-primary-fixed/20 dark:bg-card dark:hover:bg-primary-fixed/15">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <span className="material-symbols-outlined text-primary dark:text-primary">
                  local_gas_station
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Fuel Log: 45.2L</div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  OCT 24, 2023 • 09:12 AM
                </div>
              </div>
            </div>
            <div className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
              Pending
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-lowest p-4 transition-colors hover:bg-primary-fixed/20 dark:bg-card dark:hover:bg-primary-fixed/15">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <span className="material-symbols-outlined text-primary">build</span>
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Brake Inspection</div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  OCT 22, 2023 • 04:45 PM
                </div>
              </div>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 uppercase dark:bg-emerald-900/40 dark:text-emerald-200">
              Approved
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
