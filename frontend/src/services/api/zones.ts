import { apiRequest } from './client'
import { toQueryString, type TenantListQuery } from './queryString'
import type { PaginatedItems, ZoneResource } from './types'

async function unwrapPaginatedZones(data: unknown): Promise<PaginatedItems<ZoneResource>> {
  if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
    return data as PaginatedItems<ZoneResource>
  }
  if (Array.isArray(data)) {
    return {
      items: data as ZoneResource[],
      meta: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
    }
  }
  return { items: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } }
}

export async function listZones(query: TenantListQuery = {}): Promise<PaginatedItems<ZoneResource>> {
  const data = await apiRequest<unknown>(`/zones${toQueryString(query)}`)
  return unwrapPaginatedZones(data)
}

export interface StoreZoneBody {
  city: string
  name: string
  number_of_stores?: number
}

export function createZone(body: StoreZoneBody): Promise<ZoneResource> {
  return apiRequest<ZoneResource>('/zones', { method: 'POST', body })
}

export function updateZone(id: number | string, body: Partial<StoreZoneBody>): Promise<ZoneResource> {
  return apiRequest<ZoneResource>(`/zones/${id}`, { method: 'PUT', body })
}

export function getZone(id: number | string): Promise<ZoneResource> {
  return apiRequest<ZoneResource>(`/zones/${id}`)
}

export function deleteZone(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/zones/${id}`, { method: 'DELETE' })
}
