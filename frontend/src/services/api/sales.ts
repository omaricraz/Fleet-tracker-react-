import { apiRequest } from './client'
import { toQueryString } from './queryString'
import type { SaleRecord } from './types'

export interface ListSalesQuery {
  trip_id?: number
  driver_id?: number
  product_id?: number
  customer_id?: number
  date_from?: string
  date_to?: string
}

export function listSales(query: ListSalesQuery = {}): Promise<SaleRecord[]> {
  return apiRequest<SaleRecord[]>(`/sales${toQueryString(query)}`)
}

export function getMySales(): Promise<SaleRecord[]> {
  return apiRequest<SaleRecord[]>('/sales/my')
}

/**
 * Laravel `POST /sales` validates one sale per request:
 * trip_id, product_id, customer_id, quantity, total_price — not a batched `items` array.
 */
export interface StoreSaleBody {
  trip_id: number
  customer_id: number
  product_id: number
  quantity: number
  /** Line total equal to unit price × quantity (2 decimal places recommended). */
  total_price: number
}

export function createSale(body: StoreSaleBody): Promise<SaleRecord> {
  return apiRequest<SaleRecord>('/sales', { method: 'POST', body })
}

export function updateSale(saleId: number | string, body: { total_price: number }): Promise<SaleRecord> {
  return apiRequest<SaleRecord>(`/sales/${saleId}`, { method: 'PATCH', body })
}

export function deleteSale(saleId: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/sales/${saleId}`, { method: 'DELETE' })
}
