import { Layers3, Sparkles, WandSparkles } from 'lucide-react'

import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { FilterBar } from '@/components/FilterBar'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import type { AppRouteMeta } from '@/types/navigation'

export function PlaceholderPage({ route }: { route: AppRouteMeta }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Foundation Placeholder"
        title={route.title}
        description={route.description}
        actions={
          <>
            <StatusBadge label="Phase 1" tone="info" />
            <Button variant="secondary">Design Token Ready</Button>
          </>
        }
      />

      <FilterBar
        searchPlaceholder={`Search ${route.navLabel.toLowerCase()} building blocks`}
        filters={
          <>
            <StatusBadge label="Routing Ready" tone="success" />
            <StatusBadge label="Logic Later" tone="warning" />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card
          title="Reusable foundation"
          description="This view intentionally stays light on business detail while proving the shell, spacing, and component primitives."
          accent="primary"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4">
              <p className="eyebrow mb-2">Shell</p>
              <p className="text-3xl font-black tracking-[-0.03em] text-foreground">Responsive</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sidebar, top navbar, and floating mobile dock all derive from shared route metadata.
              </p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="eyebrow mb-2">Theme</p>
              <p className="text-3xl font-black tracking-[-0.03em] text-foreground">
                CSS Variables
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tonal layers mirror the design references without relying on hard borders.
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="What comes next"
          description="Phase 2 can attach real workflows to these placeholders without reworking the shell."
          accent="secondary"
        >
          <EmptyState
            icon={Sparkles}
            title={`${route.navLabel} flows intentionally deferred`}
            description="Backend integration, data fetching, and complex forms are intentionally out of scope for this phase. The goal here is stable UI architecture."
            action={<Button variant="outline">Architecture Baseline</Button>}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Card
          title="Status cues"
          description="Base utility components available project-wide."
          accent="success"
        >
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Card" tone="success" />
            <StatusBadge label="PageHeader" tone="success" />
            <StatusBadge label="FilterBar" tone="success" />
            <StatusBadge label="EmptyState" tone="success" />
            <StatusBadge label="LoadingSkeleton" tone="success" />
          </div>
        </Card>

        <Card
          title="Loading state preview"
          description="Skeletons stay understated so future modules can drop them into dense operational views."
          accent="warning"
        >
          <LoadingSkeleton />
        </Card>
      </div>

      <Card
        title="Design translation notes"
        description="A few signals carried directly from the `design docs` references into the foundation."
        accent="primary"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-muted p-4">
            <Layers3 className="mb-3 size-5 text-primary" />
            <p className="font-semibold text-foreground">Tonal layering</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Surfaces separate content through value shifts, not through heavy divider lines.
            </p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <WandSparkles className="mb-3 size-5 text-primary" />
            <p className="font-semibold text-foreground">Editorial spacing</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Generous padding and tight heading tracking create the premium control-room feel.
            </p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <Sparkles className="mb-3 size-5 text-primary" />
            <p className="font-semibold text-foreground">Restrained gradients</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Brand gradients are reserved for primary actions and hero moments rather than every panel.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
