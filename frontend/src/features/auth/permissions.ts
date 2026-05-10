import type { UserResource } from '@/services/api/types'

/** Tenant roles that manage fleet operations (not platform superadmin, not driver). */
export function isTenantStaff(user: UserResource | null): boolean {
  if (!user || user.is_platform_admin) return false
  return user.role === 'admin' || user.role === 'manager'
}

export function isSuperAdmin(user: UserResource | null): boolean {
  return Boolean(user?.is_platform_admin)
}

export function isDriver(user: UserResource | null): boolean {
  return Boolean(user && user.role === 'driver' && !user.is_platform_admin)
}

/** Paths admin/manager may use in the desktop app shell. */
const STAFF_PATH_PREFIXES = [
  '/fleet-management',
  '/trip-management',
  '/resource-management',
  '/request-management',
  '/user-management',
] as const

function pathMatchesStaffAllowed(pathname: string): boolean {
  const normalized = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  return STAFF_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

/** Whether the user may load this pathname (ignores query string). */
export function canAccessPath(user: UserResource | null, pathname: string): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (isDriver(user)) {
    if (pathname.startsWith('/driver/trip')) return false
    if (pathname === '/driver' || pathname === '/driver/') return true
    if (pathname.startsWith('/driver/sales')) return true
    return false
  }

  if (isTenantStaff(user)) {
    if (pathname.startsWith('/driver')) return false
    return pathMatchesStaffAllowed(pathname)
  }

  return false
}

/** Default landing route after login or when fixing an unauthorized URL. */
export function getHomePath(user: UserResource | null): string {
  if (!user) return '/login'
  if (isSuperAdmin(user)) return '/platform'
  if (isDriver(user)) return '/driver'
  return '/fleet-management'
}

/** Sidebar / manifest route visibility for the desktop app shell. */
export function canSeeAppRoute(user: UserResource | null, routePath: string): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isDriver(user)) return false
  if (isTenantStaff(user)) {
    return STAFF_PATH_PREFIXES.some(
      (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
    )
  }
  return false
}
