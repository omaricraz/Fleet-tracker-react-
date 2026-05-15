import type { LucideIcon } from 'lucide-react'

export type AppRouteGroup = 'workspace' | 'operations' | 'insights'
export type AppShellKind = 'auth' | 'app'

export interface AppRouteMeta {
  path: string
  title: string
  navLabel: string
  description: string
  icon: LucideIcon
  shell: AppShellKind
  group?: AppRouteGroup
  showInSidebar?: boolean
}
