import { Menu, PanelLeftClose, X } from 'lucide-react'
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
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function SidebarNav({
  collapsed = false,
  onToggleCollapsed,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarNavProps) {
  const { user } = useAuth()
  if (!user) return null

  const closeMobile = () => onMobileOpenChange?.(false)

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-background/55 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        id="app-sidebar-nav"
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'surface-layer fixed inset-y-0 left-0 z-50 flex flex-col py-6 shadow-2xl transition-[transform,width,padding] duration-200 ease-out md:z-40 md:border-r-0 md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-72 px-4 md:w-16 md:px-2' : 'w-72 px-4',
        )}
      >
        <div className="flex items-center justify-end px-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>

        <AppLogo className={cn('px-2', collapsed && 'md:justify-center md:px-0')} compact={collapsed} />

        <nav className={cn('flex-1 space-y-7 overflow-y-auto pr-2', collapsed ? 'mt-4 md:mt-6' : 'mt-6 md:mt-10')}>
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
                <p className={cn('eyebrow px-3', collapsed && 'md:sr-only')}>{group.label}</p>
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
                            collapsed ? 'justify-between px-4 py-3 md:justify-center md:px-2 md:py-3' : 'justify-between px-4 py-3',
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50 hover:text-foreground',
                          )
                        }
                        onClick={closeMobile}
                      >
                        {({ isActive }) => (
                          <>
                            <span className="flex min-w-0 items-center gap-3">
                              <span
                                className={cn(
                                  'relative flex shrink-0 items-center justify-center',
                                  collapsed &&
                                    route.path === '/reports' &&
                                    'md:after:absolute md:after:top-0 md:after:right-0 md:after:size-2 md:after:rounded-full md:after:bg-primary',
                                )}
                              >
                                <Icon
                                  className={cn('size-4', isActive ? 'text-accent-foreground' : '')}
                                />
                              </span>
                              <span className={cn(collapsed && 'md:sr-only')}>{route.navLabel}</span>
                            </span>
                            {route.path === '/reports' ? (
                              <span className={cn(collapsed && 'md:hidden')}>
                                <StatusBadge label="New" tone={isActive ? 'info' : 'neutral'} />
                              </span>
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
              'mt-auto hidden shrink-0 border-t border-border/60 pt-4 md:block',
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
    </>
  )
}
