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

export interface StoreSaleBody {
  trip_id: number
  product_id: number
  customer_id: number
  quantity: number
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
