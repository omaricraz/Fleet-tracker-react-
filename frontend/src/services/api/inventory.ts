import { apiRequest } from './client'
import { toQueryString } from './queryString'
import type { DriverInventoryData, FleetSnapshotRow } from './types'

export interface InventoryListQuery {
  car_id?: number
  product_id?: number
  low_stock?: 0 | 1
  search?: string
}

export function listInventory(query: InventoryListQuery = {}): Promise<FleetSnapshotRow[]> {
  return apiRequest<FleetSnapshotRow[]>(`/inventory${toQueryString(query)}`)
}

export function getInventoryAlerts(): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>('/inventory/alerts')
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
