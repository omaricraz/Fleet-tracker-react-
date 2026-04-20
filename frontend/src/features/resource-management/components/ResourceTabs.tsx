import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

import type { ResourceView } from '../types'

const tabs: { id: Exclude<ResourceView, 'sales'>; label: string }[] = [
  { id: 'drivers', label: 'Drivers' },
  { id: 'products', label: 'Products' },
  { id: 'zones', label: 'Zones' },
  { id: 'customers', label: 'Customers' },
]

interface ResourceTabsProps {
  view: ResourceView
}

export function ResourceTabs({ view }: ResourceTabsProps) {
  if (view === 'sales') {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-border/60">
      {tabs.map((tab) => {
        const active = view === tab.id

        return (
          <Link
            key={tab.id}
            to={{ pathname: '/resource-management', search: `?view=${tab.id}` }}
            className={cn(
              'relative pb-3 text-sm font-semibold transition-colors',
              active
                ? 'font-bold text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-t after:bg-primary'
                : 'text-muted-foreground hover:text-primary',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
