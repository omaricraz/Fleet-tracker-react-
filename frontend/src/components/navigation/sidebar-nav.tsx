import { Menu, PanelLeftClose } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { AppLogo } from '@/components/navigation/app-logo'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { canSeeAppRoute } from '@/features/auth/permissions'
import { cn } from '@/lib/utils'
import { appRoutes, routeGroups } from '@/routes/manifest'

type SidebarNavProps = {
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function SidebarNav({ collapsed = false, onToggleCollapsed }: SidebarNavProps) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <aside
      className={cn(
        'surface-layer fixed inset-y-0 left-0 z-40 hidden flex-col py-6 transition-[width] duration-200 ease-out md:flex',
        collapsed ? 'w-16 px-2' : 'w-72 px-4',
      )}
    >
      <AppLogo className={cn('px-2', collapsed && 'justify-center px-0')} compact={collapsed} />

      <nav
        id="app-sidebar-nav"
        className={cn('flex-1 space-y-7 overflow-y-auto pr-2', collapsed ? 'mt-6' : 'mt-10')}
      >
        {routeGroups.map((group) => {
          const routes = appRoutes.filter(
            (route) =>
              route.group === group.id &&
              route.showInSidebar &&
              canSeeAppRoute(user, route.path),
          )

          if (routes.length === 0) {
            return null
          }

          return (
            <div key={group.id} className="space-y-2">
              <p className={cn('eyebrow px-3', collapsed && 'sr-only')}>{group.label}</p>
              <div className="space-y-1">
                {routes.map((route) => {
                  const Icon = route.icon

                  return (
                    <NavLink
                      key={route.path}
                      to={route.path}
                      title={route.navLabel}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center rounded-full text-sm font-medium text-muted-foreground transition-all',
                          collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50 hover:text-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                'relative flex shrink-0 items-center justify-center',
                                collapsed &&
                                  route.path === '/reports' &&
                                  'after:absolute after:top-0 after:right-0 after:size-2 after:rounded-full after:bg-primary',
                              )}
                            >
                              <Icon
                                className={cn('size-4', isActive ? 'text-accent-foreground' : '')}
                              />
                            </span>
                            <span className={cn(collapsed && 'sr-only')}>{route.navLabel}</span>
                          </span>
                          {route.path === '/reports' && !collapsed ? (
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

      {onToggleCollapsed ? (
        <div
          className={cn(
            'mt-auto shrink-0 border-t border-border/60 pt-4',
            collapsed ? 'px-0' : 'px-2',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            className="flex h-10 w-full items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleCollapsed}
          >
            {collapsed ? (
              <Menu className="size-5" aria-hidden />
            ) : (
              <PanelLeftClose className="size-5" aria-hidden />
            )}
          </Button>
        </div>
      ) : null}
    </aside>
  )
}
