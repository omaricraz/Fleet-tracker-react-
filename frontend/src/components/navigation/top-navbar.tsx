import { LogOut, Menu } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { InventoryAlertsBell } from '@/components/navigation/InventoryAlertsBell'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'
import { getRouteMeta } from '@/routes/manifest'

const RESOURCE_VIEWS = [
  { id: 'products', label: 'Products' },
  { id: 'zones', label: 'Zones' },
  { id: 'customers', label: 'Customers' },
] as const

type TopNavbarProps = {
  sidebarCollapsed?: boolean
  mobileNavOpen?: boolean
  onOpenMobileSidebar?: () => void
}

function MobileSidebarOpenButton({
  mobileNavOpen,
  onOpenMobileSidebar,
}: {
  mobileNavOpen?: boolean
  onOpenMobileSidebar?: () => void
}) {
  if (!onOpenMobileSidebar) return null

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="shrink-0 rounded-full md:hidden"
      aria-label="Open menu"
      aria-expanded={mobileNavOpen ?? false}
      aria-controls="app-sidebar-nav"
      onClick={onOpenMobileSidebar}
    >
      <Menu className="size-5" aria-hidden />
    </Button>
  )
}

export function TopNavbar({
  sidebarCollapsed = false,
  mobileNavOpen = false,
  onOpenMobileSidebar,
}: TopNavbarProps = {}) {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const route = getRouteMeta(pathname)
  const { logout } = useAuth()

  const isResourceManagement = pathname === '/resource-management'
  const activeView = searchParams.get('view') ?? 'products'

  const headerLeftOffset = sidebarCollapsed ? 'md:left-16' : 'md:left-72'

  if (isResourceManagement) {
    return (
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-30 border-b border-border/50 bg-card/95 shadow-sm backdrop-blur-md transition-[left] duration-200 ease-out',
          headerLeftOffset,
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex items-center gap-2 lg:gap-3">
              <MobileSidebarOpenButton
                mobileNavOpen={mobileNavOpen}
                onOpenMobileSidebar={onOpenMobileSidebar}
              />
              <span className="shrink-0 text-xl font-black tracking-tighter text-foreground lg:text-2xl">
                Fleet Tracker
              </span>
            </div>
            <nav
              className="-mx-1 flex gap-4 overflow-x-auto pb-1 md:gap-6 lg:mx-0 lg:pb-0"
              aria-label="Resource modules"
            >
              {RESOURCE_VIEWS.map((item) => {
                const active = activeView === item.id

                return (
                  <Link
                    key={item.id}
                    to={`/resource-management?view=${item.id}`}
                    className={cn(
                      'shrink-0 border-b-2 border-transparent pb-1 text-sm font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'border-primary font-bold text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <InventoryAlertsBell buttonVariant="ghost" />
            <ThemeToggle />
            <button
              type="button"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Log out"
              onClick={() => void logout()}
            >
              <LogOut className="size-5" />
            </button>
            <div
              className="ml-1 size-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
              aria-hidden
            >
              <img
                alt="Profile"
                className="size-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL2JF3Huv88GedVqbSwFTEuBIO-OMCpgrXhPodTCc0jMv1cbkKGIXW6VqNbmhVsKW2XptJzHmxi6GxCRM_wq3aYdbWkrR7_CrWcMAdLaFD8S6mPiBpD49kSbB1Jtrf8Xaae0p39d-oRsglQXuGdcbx8QA5KWz8RgAK1RxjmO47hmTye4Vqn4ulcXq9rzI-_lUFvpZUhOWTQddAcU7qTCBEYop_cv1NHCedBKm69LsKYzXCi9_WUkjac7XDvRzz6z7TEXlxYCcBUmUA"
              />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 border-0 bg-background/92 backdrop-blur transition-[left] duration-200 ease-out',
        headerLeftOffset,
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-10">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
          <MobileSidebarOpenButton
            mobileNavOpen={mobileNavOpen}
            onOpenMobileSidebar={onOpenMobileSidebar}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="eyebrow">Fleet Tracker</p>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black tracking-[-0.03em] text-foreground sm:text-xl">
                {route.title}
              </h2>
              <p className="hidden truncate text-sm text-muted-foreground md:block">
                {route.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground lg:flex">
            Search the command center
          </div>
          <InventoryAlertsBell buttonVariant="secondary" />
          <ThemeToggle />
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            aria-label="Log out"
            onClick={() => void logout()}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
