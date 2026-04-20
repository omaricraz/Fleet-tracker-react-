import { NavLink } from 'react-router-dom'

import { AppLogo } from '@/components/navigation/app-logo'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { appRoutes, routeGroups } from '@/routes/manifest'

export function SidebarNav() {
  return (
    <aside className="surface-layer fixed inset-y-0 left-0 z-40 hidden w-72 flex-col px-4 py-6 md:flex">
      <AppLogo className="px-2" />

      <nav className="mt-10 flex-1 space-y-7 overflow-y-auto pr-2">
        {routeGroups.map((group) => {
          const routes = appRoutes.filter(
            (route) => route.group === group.id && route.showInSidebar,
          )

          if (routes.length === 0) {
            return null
          }

          return (
            <div key={group.id} className="space-y-2">
              <p className="eyebrow px-3">{group.label}</p>
              <div className="space-y-1">
                {routes.map((route) => {
                  const Icon = route.icon

                  return (
                    <NavLink
                      key={route.path}
                      to={route.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-full px-4 py-3 text-sm font-medium text-muted-foreground transition-all',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50 hover:text-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-3">
                            <Icon className={cn('size-4', isActive ? 'text-accent-foreground' : '')} />
                            {route.navLabel}
                          </span>
                          {route.path === '/reports' ? (
                            <StatusBadge label="New" tone={isActive ? 'info' : 'neutral'} />
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="space-y-3 px-2 pt-4">
        <Button className="w-full justify-between" size="lg">
          Quick Dispatch
          <span className="text-xs uppercase tracking-[0.16em] text-primary-foreground/70">
            Phase 1
          </span>
        </Button>
        <div className="rounded-xl bg-card/70 p-4 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
          Routing, theming, and shell patterns are live. Workflow logic stays intentionally deferred.
        </div>
      </div>
    </aside>
  )
}
