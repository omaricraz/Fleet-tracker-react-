/**
 * Mock KPI and operational stats for the tenant admin dashboard.
 * Replace with API responses when backend is available.
 */

export interface DashboardStats {
  tenantName: string
  tenantStatusLabel: string
  heroSubtitle: string
  salesToday: {
    amountFormatted: string
    amountCentsDisplay: string
    changePercent: string
    subtitle: string
  }
  activeTrips: {
    count: number
    pendingAssignment: number
  }
  fuelCostWtd: {
    amountFormatted: string
    vsLastWeekPercent: string
  }
  carsAvailable: {
    available: number
    total: number
  }
  lowStockAlerts: {
    count: number
    subtitle: string
  }
  maintenanceQueue: {
    totalFlagged: number
    critical: number
    scheduled: number
  }
}

export const dashboardStats: DashboardStats = {
  tenantName: 'Zamzam Logistics',
  tenantStatusLabel: 'Tenant Instance Active',
  heroSubtitle:
    'Live operational overview and high-density performance metrics for current active fleet units.',
  salesToday: {
    amountFormatted: '$42,850',
    amountCentsDisplay: '.00',
    changePercent: '+18.2%',
    subtitle: 'Real-time revenue from completed & active trips',
  },
  activeTrips: {
    count: 124,
    pendingAssignment: 4,
  },
  fuelCostWtd: {
    amountFormatted: '$9,420',
    vsLastWeekPercent: '+4.1%',
  },
  carsAvailable: {
    available: 86,
    total: 250,
  },
  lowStockAlerts: {
    count: 12,
    subtitle: 'Inventory items require refill',
  },
  maintenanceQueue: {
    totalFlagged: 7,
    critical: 2,
    scheduled: 5,
  },
}

export interface RecentSaleRow {
  id: string
  tripRef: string
  label: string
  amountFormatted: string
}

export const recentSalesMock: RecentSaleRow[] = [
  { id: '1', tripRef: 'TRP-8091', label: 'B2B Delivery', amountFormatted: '+$1,250' },
  { id: '2', tripRef: 'TRP-8090', label: 'Express Freight', amountFormatted: '+$840' },
  { id: '3', tripRef: 'TRP-8089', label: 'Standard Crate', amountFormatted: '+$320' },
]
