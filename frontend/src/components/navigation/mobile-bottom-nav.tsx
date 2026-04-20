import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { appRoutes } from '@/routes/manifest'

const mobileRoutes = appRoutes.filter((route) => route.showInMobileNav)

export function MobileBottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:hidden">
      <nav className="glass-dock ambient-shadow flex w-full max-w-md items-center justify-between rounded-[var(--radius-xl)] border border-border px-3 py-2">
        {mobileRoutes.map((route) => {
          const Icon = route.icon

          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-4" />
              <span className="truncate">{route.navLabel}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
