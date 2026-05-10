/** Shared list query params for tenant paginated index routes (see `backendintegration.md`). */
export interface TenantListQuery {
  per_page?: number
  page?: number
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

export function toQueryString(params: object): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      sp.set(k, String(v))
    }
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}
