import { zoneConicGradient, zoneDistribution } from '@/features/dashboard/data/dashboardCharts'

export function ZoneChartCard() {
  const gradient = zoneConicGradient(zoneDistribution)

  return (
    <div className="flex-1 rounded-xl bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(11,28,48,0.02)]">
      <h3 className="mb-6 text-lg font-bold text-primary">Trips by Zone</h3>
      <div className="flex flex-wrap items-center gap-6">
        <div
          className="relative size-32 shrink-0 rounded-full shadow-inner"
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 m-auto size-16 rounded-full bg-surface-lowest" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {zoneDistribution.map((z) => (
            <div key={z.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: z.color }}
                />
                <span className="font-medium text-primary">{z.label}</span>
              </div>
              <span className="font-bold text-primary">{z.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
