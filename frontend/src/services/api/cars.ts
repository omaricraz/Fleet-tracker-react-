import { apiRequest } from './client'
import { toQueryString, type TenantListQuery } from './queryString'
import type { CarResource, PaginatedItems } from './types'

async function unwrapCars(data: unknown): Promise<PaginatedItems<CarResource>> {
  if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
    return data as PaginatedItems<CarResource>
  }
  if (Array.isArray(data)) {
    return {
      items: data as CarResource[],
      meta: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
    }
  }
  return { items: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } }
}

export async function listCars(query: TenantListQuery = {}): Promise<PaginatedItems<CarResource>> {
  const data = await apiRequest<unknown>(`/cars${toQueryString(query)}`)
  return unwrapCars(data)
}

export interface StoreCarBody {
  model: string
  plate_number: string
  color?: string | null
  overall_volume_capacity?: number | null
  overall_weight_capacity?: number | null
  [key: string]: unknown
}

export function createCar(body: StoreCarBody): Promise<CarResource> {
  return apiRequest<CarResource>('/cars', { method: 'POST', body })
}

export function updateCar(id: number | string, body: Partial<StoreCarBody>): Promise<CarResource> {
  return apiRequest<CarResource>(`/cars/${id}`, { method: 'PUT', body })
}

export function getCar(id: number | string): Promise<CarResource> {
  return apiRequest<CarResource>(`/cars/${id}`)
}

export function deleteCar(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/cars/${id}`, { method: 'DELETE' })
}
