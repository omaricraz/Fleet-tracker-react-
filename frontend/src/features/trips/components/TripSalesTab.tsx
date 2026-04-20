import type { SalesRow } from '@/features/trips/types'

export function TripSalesTab({ rows }: { rows: SalesRow[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        Sales Breakdown
      </h3>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-surface-low">
        <table className="w-full table-fixed text-left">
          <thead className="bg-surface-high text-[9px] font-bold uppercase text-muted-foreground">
            <tr>
              <th className="w-1/2 px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50">
                <td className="truncate px-4 py-3 font-bold text-primary">{row.product}</td>
                <td className="px-4 py-3 text-right font-medium">{row.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
