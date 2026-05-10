/** Laravel API envelopes — see `backendintegration.md`. */

export type UserRole = 'admin' | 'manager' | 'driver'

export interface UserResource {
  id: number
  name: string
  email: string
  role: UserRole
  tenant_id: number | null
  is_platform_admin: boolean
}

export interface ApiSuccessEnvelope<T> {
  success: true
  message: string
  data: T
}

export interface ApiErrorEnvelope {
  success: false
  message: string
  errors: Record<string, string[]>
  details?: InsufficientInventoryDetails
}

export interface InsufficientInventoryDetails {
  car_id: number
  product_id: number
  available: string
  requested: string
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface PaginatedItems<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ZoneResource {
  id: number
  tenant_id: number
  name: string
  city: string
  number_of_stores: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface CarResource {
  id: number
  tenant_id: number
  model: string
  plate_number: string
  color?: string | null
  overall_volume_capacity?: string | number | null
  overall_weight_capacity?: string | number | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface DriverResource {
  id: number
  tenant_id: number
  full_name: string
  phone: string
  zone_id?: number | null
  zone?: ZoneResource | null
  created_at?: string
  updated_at?: string
}

export interface ProductResource {
  id: number
  tenant_id: number
  item: string
  type?: string | null
  price?: string | number | null
  unit_volume?: string | number | null
  unit_weight?: string | number | null
  created_at?: string
  updated_at?: string
}

export interface CustomerResource {
  id: number
  tenant_id: number
  full_name: string
  phone: string
  zone_id?: number | null
  zone?: ZoneResource | null
  latitude?: string | number | null
  longitude?: string | number | null
  created_at?: string
  updated_at?: string
}

export interface TripTimelineEvent {
  id?: number
  event_type: string
  user_id?: number | null
  quantity?: string | number | null
  amount?: string | number | null
  product_id?: number | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface TripDetailData {
  trip: Record<string, unknown>
  driver: Record<string, unknown>
  car: Record<string, unknown>
  timeline: TripTimelineEvent[]
  inventory_summary: {
    on_hand: Array<{ product_id: number; product_name: string; quantity: string }>
    transactions_by_type_for_trip: Record<string, unknown>
  }
  sales_summary: Array<{ product_id: number; quantity: number; total_price: string }>
}

export type TripListItem = Record<string, unknown> & {
  id: number
  driver?: DriverResource | Record<string, unknown> | null
  car?: CarResource | Record<string, unknown> | null
  zone?: ZoneResource | Record<string, unknown> | null
}

export type SaleRecord = Record<string, unknown> & {
  id: number
  trip_id?: number
  product_id?: number
  customer_id?: number
  driver_id?: number
  quantity?: number | string
  total_price?: string | number
  created_at?: string
}

export interface DriverInventoryData {
  car: CarResource | null
  snapshot: Array<{ product_id: number; product_name: string; quantity: string }>
  transactions: Array<{
    id: number
    product_id: number
    product_name: string
    quantity: string
    type: string
    trip_id: number | null
    sale_id: number | null
    before_qty: string | null
    after_qty: string | null
    created_at: string
  }>
}

export interface FleetSnapshotRow {
  car_id: number
  car_name: string
  items: Array<{ product_id: number; product_name: string; quantity: string }>
}
