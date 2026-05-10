import { apiRequest } from './client'
import { toQueryString, type TenantListQuery } from './queryString'
import type { PaginatedItems, ProductResource } from './types'

async function unwrapProducts(data: unknown): Promise<PaginatedItems<ProductResource>> {
  if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
    return data as PaginatedItems<ProductResource>
  }
  if (Array.isArray(data)) {
    return {
      items: data as ProductResource[],
      meta: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
    }
  }
  return { items: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } }
}

export async function listProducts(query: TenantListQuery = {}): Promise<PaginatedItems<ProductResource>> {
  const data = await apiRequest<unknown>(`/products${toQueryString(query)}`)
  return unwrapProducts(data)
}

export interface StoreProductBody {
  item: string
  type?: string | null
  price?: number | string | null
  unit_volume?: number | string | null
  unit_weight?: number | string | null
}

export function createProduct(body: StoreProductBody): Promise<ProductResource> {
  return apiRequest<ProductResource>('/products', { method: 'POST', body })
}

export function updateProduct(id: number | string, body: Partial<StoreProductBody>): Promise<ProductResource> {
  return apiRequest<ProductResource>(`/products/${id}`, { method: 'PUT', body })
}

export function getProduct(id: number | string): Promise<ProductResource> {
  return apiRequest<ProductResource>(`/products/${id}`)
}

export function deleteProduct(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/products/${id}`, { method: 'DELETE' })
}
