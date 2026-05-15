/** Laravel API envelopes — see `backendintegration.md`. */

export type UserRole = 'admin' | 'manager' | 'driver'

export interface UserResource {
  id: number
  name: string
  email: string
  role: UserRole
  tenant_id: number | null
  is_platform_admin: boolean
  /** Drivers table id from GET `/auth/me` when the user is linked to a driver record. */
  driver_id?: number | null
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
  /** Linked auth user id when the backend exposes it. */
  user_id?: number | null
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

/** Row from GET /driver/inventory/products (normalized on the client). */
export interface DriverPosInventoryProduct {
  product: ProductResource
  /** On-hand quantity for POS stock column */
  quantity: number
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

/** Optional per-product rollup from inventory APIs (e.g. server-computed closing variance). */
export interface DriverInventoryReconciliationLine {
  product_id: number
  product_name?: string
  variance?: string | number | null
}

export interface DriverInventoryData {
  car: CarResource | null
  snapshot: Array<{ product_id: number; product_name: string; quantity: string }>
  /** When the API includes a reconciliation summary, variance should be taken from here (or from closing transactions). */
  reconciliation?: DriverInventoryReconciliationLine[]
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
    /** Server-computed variance when present (e.g. on closing rows). */
    variance?: string | number | null
  }>
}

export interface FleetSnapshotRow {
  car_id: number
  car_name: string
  items: Array<{ product_id: number; product_name: string; quantity: string }>
}

/** Normalized row from GET /inventory/alerts (`InventoryService::getAlerts` buckets or paginated items). */
export interface InventoryAlertItem {
  id: string
  /** Canonical bucket, e.g. `low_stock`, `zero_stock`. */
  kind: string
  title: string
  detail: string
  created_at: string | null
  car_id?: number
  car_name?: string
  product_id?: number
  product_name?: string
  /** Normalized decimal string from backend (`InventoryMath::normalize`). */
  quantity?: string
}
