import { apiRequest } from './client'
import { toQueryString, type TenantListQuery } from './queryString'
import type { CustomerResource, PaginatedItems } from './types'

async function unwrapCustomers(data: unknown): Promise<PaginatedItems<CustomerResource>> {
  if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
    return data as PaginatedItems<CustomerResource>
  }
  if (Array.isArray(data)) {
    return {
      items: data as CustomerResource[],
      meta: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
    }
  }
  return { items: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } }
}

export async function listCustomers(query: TenantListQuery = {}): Promise<PaginatedItems<CustomerResource>> {
  const data = await apiRequest<unknown>(`/customers${toQueryString(query)}`)
  return unwrapCustomers(data)
}

export interface StoreCustomerBody {
  full_name: string
  phone: string
  zone_id?: number | null
  latitude?: number | string | null
  longitude?: number | string | null
}

export function createCustomer(body: StoreCustomerBody): Promise<CustomerResource> {
  return apiRequest<CustomerResource>('/customers', { method: 'POST', body })
}

export function updateCustomer(id: number | string, body: Partial<StoreCustomerBody>): Promise<CustomerResource> {
  return apiRequest<CustomerResource>(`/customers/${id}`, { method: 'PUT', body })
}

export function getCustomer(id: number | string): Promise<CustomerResource> {
  return apiRequest<CustomerResource>(`/customers/${id}`)
}

export function deleteCustomer(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/customers/${id}`, { method: 'DELETE' })
}
