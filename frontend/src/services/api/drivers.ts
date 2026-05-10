import { apiRequest } from './client'
import { toQueryString, type TenantListQuery } from './queryString'
import type { DriverResource, PaginatedItems } from './types'

async function unwrapDrivers(data: unknown): Promise<PaginatedItems<DriverResource>> {
  if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
    return data as PaginatedItems<DriverResource>
  }
  if (Array.isArray(data)) {
    return {
      items: data as DriverResource[],
      meta: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
    }
  }
  return { items: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } }
}

export async function listDrivers(query: TenantListQuery = {}): Promise<PaginatedItems<DriverResource>> {
  const data = await apiRequest<unknown>(`/drivers${toQueryString(query)}`)
  return unwrapDrivers(data)
}

export interface StoreDriverBody {
  full_name: string
  phone: string
  zone_id?: number | null
}

export function createDriver(body: StoreDriverBody): Promise<DriverResource> {
  return apiRequest<DriverResource>('/drivers', { method: 'POST', body })
}

export function updateDriver(id: number | string, body: Partial<StoreDriverBody>): Promise<DriverResource> {
  return apiRequest<DriverResource>(`/drivers/${id}`, { method: 'PUT', body })
}

export function getDriver(id: number | string): Promise<DriverResource> {
  return apiRequest<DriverResource>(`/drivers/${id}`)
}

export function deleteDriver(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/drivers/${id}`, { method: 'DELETE' })
}
