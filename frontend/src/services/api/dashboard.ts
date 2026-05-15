import { apiRequest } from './client'

export interface DashboardSaleRollup {
  sale_count: number
  quantity_sum: string
  revenue_sum: string
}

export interface DashboardSummaryData {
  as_of: string
  timezone: string
  counts: {
    zones: number
    cars: number
    drivers: number
    customers: number
    products: number
    tenant_users: number
  }
  trips: {
    by_status: Record<string, number>
    active_in_progress: number
    completed_last_7_days: number
  }
  sales: {
    today: DashboardSaleRollup
    rolling_7_days: DashboardSaleRollup
  }
  requests: {
    by_status: Record<string, number>
  }
  inventory_alerts: {
    low_stock_car_product_lines: number
    zero_stock_car_product_lines: number
    negative_closing_variance_rows: number
    repeated_shortage_patterns: number
  }
}

export function fetchDashboardSummary(): Promise<DashboardSummaryData> {
  return apiRequest<DashboardSummaryData>('/dashboard/summary')
}
