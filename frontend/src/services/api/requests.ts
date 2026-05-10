import { apiRequest } from './client'
import { toQueryString } from './queryString'

export interface ListFleetRequestsQuery {
  status?: string
  type?: string
  driver_id?: number
}

/** Raw row from backend — normalized in feature layer. */
export type FleetRequestApiRecord = Record<string, unknown> & {
  id: number
  type?: string
  status?: string
  driver_id?: number
}

export async function listFleetRequests(
  query: ListFleetRequestsQuery = {},
): Promise<FleetRequestApiRecord[]> {
  const data = await apiRequest<unknown>(`/requests${toQueryString(query)}`)
  if (Array.isArray(data)) return data as FleetRequestApiRecord[]
  if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown }).items)) {
    return (data as { items: FleetRequestApiRecord[] }).items
  }
  return []
}

export async function listMyFleetRequests(): Promise<FleetRequestApiRecord[]> {
  const data = await apiRequest<unknown>('/requests/my')
  if (Array.isArray(data)) return data as FleetRequestApiRecord[]
  return []
}

export function getFleetRequest(id: number | string): Promise<FleetRequestApiRecord> {
  return apiRequest<FleetRequestApiRecord>(`/requests/${id}`)
}

/** Body keys must match backend `StoreFleetRequest` per type. */
export function createFleetRequest(body: Record<string, unknown>): Promise<FleetRequestApiRecord> {
  return apiRequest<FleetRequestApiRecord>('/requests', { method: 'POST', body })
}

export function approveFleetRequest(id: number | string): Promise<FleetRequestApiRecord> {
  return apiRequest<FleetRequestApiRecord>(`/requests/${id}/approve`, { method: 'POST', body: {} })
}

export function rejectFleetRequest(id: number | string, notes: string): Promise<FleetRequestApiRecord> {
  return apiRequest<FleetRequestApiRecord>(`/requests/${id}/reject`, { method: 'POST', body: { notes } })
}

export function deleteFleetRequest(id: number | string): Promise<unknown> {
  return apiRequest<unknown>(`/requests/${id}`, { method: 'DELETE' })
}
