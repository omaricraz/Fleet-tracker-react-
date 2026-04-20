import { Outlet } from 'react-router-dom'

import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav'
import { SidebarNav } from '@/components/navigation/sidebar-nav'
import { TopNavbar } from '@/components/navigation/top-navbar'

export function AppShell() {
  return (
    <div className="app-surface min-h-screen">
      <SidebarNav />
      <TopNavbar />
      <MobileBottomNav />

      <div className="md:pl-72">
        <main className="min-h-screen pb-28 pt-24 md:pb-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
