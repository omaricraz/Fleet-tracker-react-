export type TripStatus = 'active' | 'completed' | 'delayed'

export interface TripSummary {
  id: string
  displayId: string
  status: TripStatus
  /** e.g. "Started 2h ago" or "23 Oct, 2023" */
  timeLabel: string
  zone: string
  driverName: string
  vehicleLabel: string
  /** Revenue / distance summary for card footer */
  summaryAmount: string
  summaryDistance: string
  /** Delayed: incident title; others optional secondary */
  summarySecondary?: string
  borderAccent: 'primary' | 'completed' | 'delayed'
  /** Slightly muted card (e.g. secondary active trip) */
  subdued?: boolean
}

export type WorkspaceTabId = 'timeline' | 'inventory' | 'sales'

export interface TimelineEntry {
  id: string
  time: string
  title: string
  subtitle: string
  variant: 'shipping' | 'depart' | 'sale' | 'transit'
}

export interface InventoryRow {
  id: string
  product: string
  opening: number
  loaded: number
  sales: number
  closing: number
  variance: number
}

export interface SalesRow {
  id: string
  product: string
  qty: string
  amount: string
}

export interface TripWorkspaceDetail {
  tripId: string
  displayId: string
  status: TripStatus
  revenue: string
  distance: string
  customers: number
  driverName: string
  vehicleLabel: string
  timeline: TimelineEntry[]
  inventory: InventoryRow[]
  sales: SalesRow[]
}

export interface TripKpiSnapshot {
  activeTrips: { value: string; delta: string }
  loadingTrucks: { value: string; suffix: string }
  salesToday: { value: string }
  revenueToday: { value: string }
}
