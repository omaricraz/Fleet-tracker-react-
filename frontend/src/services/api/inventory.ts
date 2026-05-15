import { apiRequest } from './client'
import { toQueryString } from './queryString'
import type {
  DriverInventoryData,
  DriverPosInventoryProduct,
  FleetSnapshotRow,
  ProductResource,
} from './types'

function unwrapDriverInventoryProductsPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.items)) return o.items
    if (Array.isArray(o.data)) return o.data
  }
  return []
}

function parseStockQuantity(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function normalizeDriverInventoryProductRow(raw: unknown): DriverPosInventoryProduct | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const quantity = parseStockQuantity(
    row.quantity ?? row.stock ?? row.on_hand ?? row.available_quantity,
  )

  if (row.product && typeof row.product === 'object') {
    const p = row.product as Record<string, unknown>
    const id = Number(p.id)
    if (!Number.isFinite(id)) return null
    const product: ProductResource = {
      id,
      tenant_id: Number(p.tenant_id ?? 0),
      item: String(p.item ?? ''),
      type: p.type != null ? String(p.type) : null,
      price: (p.price as ProductResource['price']) ?? null,
      unit_volume: (p.unit_volume as ProductResource['unit_volume']) ?? null,
      unit_weight: (p.unit_weight as ProductResource['unit_weight']) ?? null,
      created_at: typeof p.created_at === 'string' ? p.created_at : undefined,
      updated_at: typeof p.updated_at === 'string' ? p.updated_at : undefined,
    }
    return { product, quantity }
  }

  const productId = Number(row.product_id)
  if (!Number.isFinite(productId)) return null
  const product: ProductResource = {
    id: productId,
    tenant_id: Number(row.tenant_id ?? 0),
    item: String(row.product_name ?? row.item ?? ''),
    type: row.type != null ? String(row.type) : null,
    price: (row.price as ProductResource['price']) ?? null,
    unit_volume: (row.unit_volume as ProductResource['unit_volume']) ?? null,
    unit_weight: (row.unit_weight as ProductResource['unit_weight']) ?? null,
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  }
  return { product, quantity }
}

export interface InventoryListQuery {
  car_id?: number
  product_id?: number
  low_stock?: 0 | 1
  search?: string
}

export function listInventory(query: InventoryListQuery = {}): Promise<FleetSnapshotRow[]> {
  return apiRequest<FleetSnapshotRow[]>(`/inventory${toQueryString(query)}`)
}

/** Optional query params if the backend adds pagination or filters later. */
export interface InventoryAlertsApiQuery {
  page?: number
  per_page?: number
}

export function getInventoryAlerts(query: InventoryAlertsApiQuery = {}): Promise<unknown> {
  return apiRequest<unknown>(`/inventory/alerts${toQueryString(query)}`)
}

export interface CarInventoryQuery {
  limit?: number
}

export function getCarInventory(
  carId: number | string,
  query: CarInventoryQuery = {},
): Promise<DriverInventoryData> {
  return apiRequest<DriverInventoryData>(`/cars/${carId}/inventory${toQueryString(query)}`)
}

export interface OpeningBalanceItem {
  car_id: number
  product_id: number
  actual_quantity: number
}

export interface OpeningBalanceBody {
  trip_id?: number | null
  items: OpeningBalanceItem[]
}

export function postOpeningBalance(body: OpeningBalanceBody): Promise<unknown> {
  return apiRequest<unknown>('/inventory/opening-balance', { method: 'POST', body })
}

export interface InventoryCarBatchCar {
  car_id: number
  trip_id?: number | null
  items: Array<{ product_id: number; quantity: number }>
}

export function postInventoryLoad(body: { cars: InventoryCarBatchCar[] }): Promise<unknown> {
  return apiRequest<unknown>('/inventory/load', { method: 'POST', body })
}

export function postManualSale(body: { cars: InventoryCarBatchCar[] }): Promise<unknown> {
  return apiRequest<unknown>('/inventory/manual-sale', { method: 'POST', body })
}

export interface CloseCountBody {
  trip_id?: number | null
  car_id: number
  items: Array<{ product_id: number; actual_quantity: number }>
}

export function postCloseCount(body: CloseCountBody): Promise<unknown> {
  return apiRequest<unknown>('/inventory/close-count', { method: 'POST', body })
}

export interface ReturnBody {
  notes: string
  cars: InventoryCarBatchCar[]
}

export function postInventoryReturn(body: ReturnBody): Promise<unknown> {
  return apiRequest<unknown>('/inventory/return', { method: 'POST', body })
}

export interface AdjustmentItem {
  product_id: number
  mode: 'increase' | 'decrease' | 'set'
  quantity: number
}

export interface AdjustmentBody {
  car_id: number
  trip_id?: number | null
  items: AdjustmentItem[]
}

export function postInventoryAdjustment(body: AdjustmentBody): Promise<unknown> {
  return apiRequest<unknown>('/inventory/adjustment', { method: 'POST', body })
}

export function getDriverInventory(): Promise<DriverInventoryData> {
  return apiRequest<DriverInventoryData>('/driver/inventory')
}

export async function getDriverInventoryProducts(): Promise<DriverPosInventoryProduct[]> {
  const data = await apiRequest<unknown>('/driver/inventory/products')
  return unwrapDriverInventoryProductsPayload(data)
    .map(normalizeDriverInventoryProductRow)
    .filter((row): row is DriverPosInventoryProduct => row != null)
}
