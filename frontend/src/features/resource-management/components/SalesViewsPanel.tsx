import { BarChart3, LineChart, Table2 } from 'lucide-react'

const tiles = [
  {
    title: 'Weekly revenue by zone',
    description: 'Compare realized revenue against targets across operational hubs.',
    icon: BarChart3,
  },
  {
    title: 'SKU velocity snapshot',
    description: 'Top movers, slow movers, and stock-out risk for prioritized SKUs.',
    icon: LineChart,
  },
  {
    title: 'Customer concentration',
    description: 'Share of wallet and repeat order cadence by key accounts.',
    icon: Table2,
  },
]

export function SalesViewsPanel() {
  return (
    <div className="p-6">
      <p className="text-sm text-muted-foreground">
        Sales reference views connect to reporting services in a later phase. Pick a starting lens below.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <button
              key={tile.title}
              type="button"
              className="flex flex-col rounded-xl border border-border/60 bg-muted/40 p-5 text-left shadow-sm transition hover:border-primary/40 hover:bg-card"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <p className="mt-4 font-bold text-foreground">{tile.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{tile.description}</p>
              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">
                Coming soon
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
