import { Bell, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { getRouteMeta } from '@/routes/manifest'

export function TopNavbar() {
  const { pathname } = useLocation()
  const route = getRouteMeta(pathname)

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-0 bg-background/92 backdrop-blur md:left-72">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="min-w-0 space-y-1">
          <p className="eyebrow">Fleet Tracker</p>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black tracking-[-0.03em] text-foreground">
              {route.title}
            </h2>
            <p className="hidden truncate text-sm text-muted-foreground md:block">
              {route.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground lg:flex">
            <Search className="size-4" />
            Search the command center
          </div>
          <Button variant="secondary" size="icon" className="rounded-full" aria-label="Notifications">
            <Bell />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
