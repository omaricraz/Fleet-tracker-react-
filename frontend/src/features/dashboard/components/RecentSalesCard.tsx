import { MoreHorizontal, Receipt } from 'lucide-react'

import type { RecentSaleRow } from '@/features/dashboard/data/dashboardStats'

type Props = {
  sales: RecentSaleRow[]
}

export function RecentSalesCard({ sales }: Props) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(11,28,48,0.02)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-primary">Recent Sales</h3>
        <button
          type="button"
          className="rounded-md text-[var(--outline-variant)] transition-colors hover:text-primary"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </div>
      <div className="flex max-h-56 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {sales.map((row) => (
          <div
            key={row.id}
            className="group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-primary-fixed/20"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-low text-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Receipt className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-primary">
                  {row.tripRef}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                  {row.label}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-black text-primary">{row.amountFormatted}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 w-full py-2 text-xs font-bold uppercase tracking-widest text-secondary transition-colors hover:text-primary"
      >
        View All Transactions
      </button>
    </div>
  )
}
