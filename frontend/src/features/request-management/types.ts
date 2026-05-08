export type RequestType = 'fuel' | 'maintenance' | 'inventory'

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface RequestDriver {
  id: string
  name: string
  vehicle_label?: string | null
}

export interface FleetRequest {
  id: string
  display_id: string
  type: RequestType
  status: RequestStatus
  driver: RequestDriver
  notes: string | null
  maintenance_requested: string | null
  fuel_requested: string | null
  inventory_requested: string | null
  litre_cost: number | null
  invoice_url?: string | null
  created_at: string
}

export type DateRangePreset = 'all' | 'today' | 'last_7' | 'last_30'

export interface RequestListQuery {
  search: string
  type: RequestType | 'all'
  status: RequestStatus | 'all'
  driverId: string | 'all'
  datePreset: DateRangePreset
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface RequestMetrics {
  total: number
  pending: number
  approved: number
  rejected: number
}

export type RequestDecisionAction = 'approve' | 'reject'
