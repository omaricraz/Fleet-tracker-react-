import {
  approveFleetRequest,
  createFleetRequest,
  listFleetRequests,
  listMyFleetRequests,
  rejectFleetRequest,
  type FleetRequestApiRecord,
} from '@/services/api/requests'
import { listDrivers } from '@/services/api/drivers'
import type {
  FleetRequest,
  PaginatedResult,
  RequestListQuery,
  RequestMetrics,
  RequestStatus,
  RequestType,
} from '../types'

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function normalizeFleetRequest(r: FleetRequestApiRecord): FleetRequest {
  const driverRaw =
    r.driver && typeof r.driver === 'object'
      ? (r.driver as Record<string, unknown>)
      : null
  const driverId =
    driverRaw && typeof driverRaw.id === 'number'
      ? String(driverRaw.id)
      : typeof r.driver_id === 'number'
        ? String(r.driver_id)
        : ''
  const driverName =
    driverRaw && typeof driverRaw.full_name === 'string'
      ? driverRaw.full_name
      : '—'

  const typeStr = pickString(r.type).toLowerCase()
  const statusStr = pickString(r.status).toLowerCase()

  return {
    id: String(r.id),
    display_id: pickString(r.display_id) || `REQ-${r.id}`,
    type: (['fuel', 'maintenance'].includes(typeStr) ? typeStr : 'maintenance') as RequestType,
    status: (['pending', 'approved', 'rejected'].includes(statusStr)
      ? statusStr
      : 'pending') as RequestStatus,
    driver: { id: driverId, name: driverName },
    notes: r.notes != null ? pickString(r.notes) : null,
    maintenance_requested:
      r.maintenance_requested != null
        ? pickString(r.maintenance_requested)
        : r.inventory_requested != null
          ? pickString(r.inventory_requested)
          : null,
    fuel_requested: r.fuel_requested != null ? pickString(r.fuel_requested) : null,
    cost:
      typeof r.cost === 'number' ? r.cost : typeof r.litre_cost === 'number' ? r.litre_cost : null,
    created_at: pickString(r.created_at) || new Date().toISOString(),
  }
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function matchesDatePreset(isoDate: string, preset: RequestListQuery['datePreset']) {
  const t = new Date(isoDate).getTime()
  const now = Date.now()
  if (preset === 'all') return true
  if (preset === 'today') {
    const s = startOfToday().getTime()
    return t >= s && t <= now
  }
  if (preset === 'last_7') {
    return t >= now - 7 * 86400000
  }
  if (preset === 'last_30') {
    return t >= now - 30 * 86400000
  }
  return true
}

function filterRequests(list: FleetRequest[], q: RequestListQuery): FleetRequest[] {
  const s = q.search.trim().toLowerCase()
  return list.filter((r) => {
    if (q.status !== 'all' && r.status !== q.status) return false
    if (q.type !== 'all' && r.type !== q.type) return false
    if (q.driverId !== 'all' && r.driver.id !== q.driverId) return false
    if (r.type !== 'fuel' && r.type !== 'maintenance') return false
    if (!matchesDatePreset(r.created_at, q.datePreset)) return false
    if (!s) return true
    return (
      r.display_id.toLowerCase().includes(s) ||
      r.driver.name.toLowerCase().includes(s) ||
      (r.notes?.toLowerCase().includes(s) ?? false) ||
      (r.maintenance_requested?.toLowerCase().includes(s) ?? false) ||
      (r.fuel_requested?.toLowerCase().includes(s) ?? false)
    )
  })
}

function metricsFromList(list: FleetRequest[]): RequestMetrics {
  return {
    total: list.length,
    pending: list.filter((r) => r.status === 'pending').length,
    approved: list.filter((r) => r.status === 'approved').length,
    rejected: list.filter((r) => r.status === 'rejected').length,
  }
}

export type RequestApiRole = 'admin' | 'manager' | 'driver'

export async function fetchRequestsForRole(
  role: RequestApiRole,
  listQuery: RequestListQuery,
): Promise<FleetRequest[]> {
  if (role === 'driver') {
    const raw = await listMyFleetRequests()
    return raw.map(normalizeFleetRequest)
  }
  const raw = await listFleetRequests({
    status: listQuery.status === 'all' ? undefined : listQuery.status,
    type: listQuery.type === 'all' ? undefined : listQuery.type,
    driver_id: listQuery.driverId === 'all' ? undefined : Number(listQuery.driverId),
  })
  return raw.map(normalizeFleetRequest)
}

export async function getRequestMetrics(
  role: RequestApiRole,
  query: Omit<RequestListQuery, 'status' | 'page' | 'pageSize'>,
): Promise<RequestMetrics> {
  const base: RequestListQuery = {
    ...query,
    status: 'all',
    page: 1,
    pageSize: 500,
  }
  const all = await fetchRequestsForRole(role, base)
  const filtered = filterRequests(all, base)
  return metricsFromList(filtered)
}

export async function listRequests(
  role: RequestApiRole,
  query: RequestListQuery,
): Promise<PaginatedResult<FleetRequest>> {
  const all = await fetchRequestsForRole(role, query)
  const filtered = filterRequests(all, query)
  const total = filtered.length
  const start = (query.page - 1) * query.pageSize
  const items = filtered.slice(start, start + query.pageSize)
  return { items, total, page: query.page, pageSize: query.pageSize }
}

export async function approveRequestApi(requestId: string): Promise<FleetRequest> {
  const raw = await approveFleetRequest(requestId)
  return normalizeFleetRequest(raw)
}

export async function rejectRequestApi(requestId: string, reason: string): Promise<FleetRequest> {
  const raw = await rejectFleetRequest(requestId, reason)
  return normalizeFleetRequest(raw)
}

export async function listRequestFilterDrivers(): Promise<Array<{ id: string; name: string }>> {
  const { items } = await listDrivers({ per_page: 100, sort: 'full_name', direction: 'asc' })
  return items.map((d) => ({ id: String(d.id), name: d.full_name }))
}

export async function submitFleetRequest(body: Record<string, unknown>): Promise<FleetRequest> {
  const raw = await createFleetRequest(body)
  return normalizeFleetRequest(raw)
}
