import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav'
import { SidebarNav } from '@/components/navigation/sidebar-nav'
import { TopNavbar } from '@/components/navigation/top-navbar'
import { useAuth } from '@/features/auth/AuthContext'
import { canAccessPath, getHomePath, isDriver } from '@/features/auth/permissions'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (user && isDriver(user)) {
    return <Navigate to={getHomePath(user)} replace />
  }

  if (user && !canAccessPath(user, pathname)) {
    return <Navigate to={getHomePath(user)} replace />
  }

  return (
    <div className="app-surface min-h-screen">
      <SidebarNav
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />
      <TopNavbar sidebarCollapsed={sidebarCollapsed} />
      <MobileBottomNav />

      <div
        className={cn(
          'transition-[padding] duration-200 ease-out',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-72',
        )}
      >
        <main className="min-h-screen pb-28 pt-24 md:pb-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
