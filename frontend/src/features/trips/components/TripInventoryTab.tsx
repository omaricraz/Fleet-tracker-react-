import type { InventoryRow } from '@/features/trips/types'
import { cn } from '@/lib/utils'

export function TripInventoryTab({ rows }: { rows: InventoryRow[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        Inventory Status
      </h3>
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-surface-low">
        <table className="min-w-[600px] w-full text-left">
          <thead className="bg-surface-high text-[9px] font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Opening</th>
              <th className="px-4 py-3 text-right">Loaded</th>
              <th className="px-4 py-3 text-right">Sales</th>
              <th className="px-4 py-3 text-right">Closing</th>
              <th className="px-4 py-3 text-right">Var.</th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-bold text-primary">{row.product}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.opening}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.loaded}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.sales}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.closing}</td>
                <td
                  className={cn(
                    'px-4 py-3 text-right font-bold tabular-nums',
                    row.variance < 0 && 'text-destructive',
                    row.variance === 0 && 'text-success',
                    row.variance > 0 && 'text-success',
                  )}
                >
                  {row.variance > 0 ? `+${row.variance}` : row.variance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
