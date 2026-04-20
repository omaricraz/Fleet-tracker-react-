import { Button } from '@/components/ui/button'
import {
  weeklyRevenueAreaClipPath,
  weeklyRevenueAxisDays,
  weeklyRevenuePolylinePoints,
} from '@/features/dashboard/data/dashboardCharts'

export function RevenueChartCard() {
  return (
    <div className="rounded-xl bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(11,28,48,0.02)] md:p-8 xl:col-span-2">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-primary">Weekly Revenue</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            7-day performance trend vs previous period
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 rounded-md font-bold text-primary hover:bg-surface-high"
        >
          Export
        </Button>
      </div>
      <div className="relative mt-4 h-64 w-full">
        <div className="absolute left-0 top-0 flex h-full w-8 flex-col justify-between text-[10px] font-bold text-[var(--outline-variant)]">
          <span>$50k</span>
          <span>$25k</span>
          <span>$0</span>
        </div>
        <div className="ml-10 flex h-full flex-col">
          <div className="relative flex flex-1 items-end overflow-hidden border-b-2 border-surface-low">
            <div
              className="absolute bottom-0 left-0 h-[80%] w-full bg-gradient-to-t from-primary-fixed/40 to-transparent"
              style={{ clipPath: weeklyRevenueAreaClipPath }}
              aria-hidden
            />
            <svg
              className="absolute left-0 top-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <polyline
                fill="none"
                points={weeklyRevenuePolylinePoints}
                stroke="var(--primary)"
                strokeWidth="0.8"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div
              className="absolute bottom-[60%] left-[45%] size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary shadow-sm"
              aria-hidden
            />
            <div
              className="absolute bottom-[80%] left-[75%] size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary shadow-sm"
              aria-hidden
            />
            <div
              className="absolute bottom-[90%] left-full size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary shadow-sm"
              aria-hidden
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--outline-variant)]">
            {weeklyRevenueAxisDays.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
