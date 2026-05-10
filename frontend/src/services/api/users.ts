import { apiRequest } from './client'
import { toQueryString, type TenantListQuery } from './queryString'
import type { PaginatedItems, UserResource } from './types'

export type ListTenantUsersQuery = TenantListQuery

async function unwrapUsers(data: unknown): Promise<PaginatedItems<UserResource>> {
  if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
    return data as PaginatedItems<UserResource>
  }
  if (Array.isArray(data)) {
    return {
      items: data as UserResource[],
      meta: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
    }
  }
  return { items: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } }
}

export async function listTenantUsers(query: ListTenantUsersQuery = {}): Promise<PaginatedItems<UserResource>> {
  const data = await apiRequest<unknown>(`/users${toQueryString(query)}`)
  return unwrapUsers(data)
}

export function getTenantUser(id: number | string): Promise<UserResource> {
  return apiRequest<UserResource>(`/users/${id}`)
}

export interface StoreTenantUserBody {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'driver'
}

export function createTenantUser(body: StoreTenantUserBody): Promise<UserResource> {
  return apiRequest<UserResource>('/users', { method: 'POST', body })
}

export interface UpdateTenantUserBody {
  name?: string
  email?: string
  password?: string | null
  role?: 'admin' | 'manager' | 'driver'
}

export function updateTenantUser(id: number | string, body: UpdateTenantUserBody): Promise<UserResource> {
  return apiRequest<UserResource>(`/users/${id}`, { method: 'PATCH', body })
}

export function deleteTenantUser(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/users/${id}`, { method: 'DELETE' })
}
