import { Link, Outlet, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

const navItems = [
  { to: '/platform', label: 'Home', icon: 'home' as const },
  { to: '/driver/trip', label: 'Trip', icon: 'local_shipping' as const },
  { to: '/driver', label: 'Submit', icon: 'add_circle' as const },
  { to: '/driver/sales', label: 'Sales', icon: 'sell' as const },
  { to: '/request-management', label: 'Requests', icon: 'pending_actions' as const },
  { to: '/admin', label: 'Profile', icon: 'person' as const },
]

function navItemActive(pathname: string, to: string) {
  if (to === '/driver') {
    return pathname === '/driver' || pathname === '/driver/'
  }
  if (to === '/driver/trip') {
    return pathname === '/driver/trip' || pathname === '/driver/trip/'
  }
  if (to === '/driver/sales') {
    return pathname.startsWith('/driver/sales')
  }
  if (to === '/platform') {
    return pathname === '/platform' || pathname.startsWith('/platform/')
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function DriverMobileShell() {
  const { pathname } = useLocation()
  const isSalesPos = pathname.startsWith('/driver/sales')
  const isTripPage = pathname === '/driver/trip' || pathname === '/driver/trip/'

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {!isSalesPos && !isTripPage ? (
        <header className="sticky top-0 z-40 flex h-16 w-full max-w-full items-center justify-between bg-surface-low px-6 font-semibold tracking-tight md:max-w-none">
          <div className="text-2xl font-black tracking-tighter text-primary dark:text-white">
            FleetOps
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined !text-2xl">notifications</span>
            </button>
            <Link
              to="/dashboard"
              className="block size-8 overflow-hidden rounded-full bg-primary-fixed"
              aria-label="Open dashboard"
            >
              <img
                alt=""
                className="size-full object-cover"
                decoding="async"
                src={DRIVER_AVATAR}
                width={32}
                height={32}
              />
            </Link>
          </div>
        </header>
      ) : null}

      <Outlet />

      <nav
        aria-label="Driver navigation"
        className="fixed inset-x-4 bottom-4 z-40 flex h-16 items-center justify-around rounded-3xl border border-transparent bg-[rgb(255_255_255/0.8)] px-5 shadow-[var(--shadow-ambient)] backdrop-blur-xl dark:border-border/60 dark:bg-[rgb(17_44_73/0.8)]"
      >
        {navItems.map(({ to, label, icon }) => {
          const active = navItemActive(pathname, to)

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex min-w-[48px] max-w-[72px] flex-1 flex-col items-center justify-center rounded-2xl p-1.5 text-[9px] font-bold tracking-widest uppercase transition-transform active:scale-90 sm:min-w-[56px] sm:text-[10px]',
                active
                  ? 'bg-primary-fixed text-accent-foreground shadow-sm dark:bg-[#112c49] dark:text-[#d3e4ff]'
                  : 'text-muted-foreground hover:text-foreground dark:text-slate-400',
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined mb-0.5 !text-[1.35rem] sm:!text-2xl',
                  active && '[font-variation-settings:"FILL"_1]',
                )}
              >
                {icon}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
