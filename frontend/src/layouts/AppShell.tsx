import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { SidebarNav } from '@/components/navigation/sidebar-nav'
import { TopNavbar } from '@/components/navigation/top-navbar'
import { useAuth } from '@/features/auth/AuthContext'
import { canAccessPath, getHomePath, isDriver } from '@/features/auth/permissions'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const needsTallTopNav = pathname === '/resource-management'

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileSidebarOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileSidebarOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onMqChange = () => {
      if (mq.matches) setMobileSidebarOpen(false)
    }
    mq.addEventListener('change', onMqChange)
    return () => mq.removeEventListener('change', onMqChange)
  }, [])

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
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />
      <TopNavbar
        sidebarCollapsed={sidebarCollapsed}
        mobileNavOpen={mobileSidebarOpen}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      <div
        className={cn(
          'transition-[padding] duration-200 ease-out',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-72',
        )}
      >
        <main
          className={cn(
            'min-h-screen pb-8 md:pb-10',
            needsTallTopNav ? 'pt-32 sm:pt-28 md:pt-24' : 'pt-[5.5rem] sm:pt-24',
          )}
        >
          <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-3 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
