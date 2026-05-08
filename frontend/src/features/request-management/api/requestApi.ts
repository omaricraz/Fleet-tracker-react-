import type {
  FleetRequest,
  PaginatedResult,
  RequestListQuery,
  RequestMetrics,
  RequestStatus,
} from '../types'
import { mockRequestSeed } from '../mock/mockRequests'

/** Flip to `false` when a real backend is wired via `httpListRequests` / mutation helpers below. */
const USE_MOCK_REQUEST_API =
  import.meta.env.VITE_USE_MOCK_REQUEST_API !== 'false'

let mockStore: FleetRequest[] = [...mockRequestSeed]

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
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
    if (q.type !== 'all' && r.type !== q.type) return false
    if (q.status !== 'all' && r.status !== q.status) return false
    if (q.driverId !== 'all' && r.driver.id !== q.driverId) return false
    if (!matchesDatePreset(r.created_at, q.datePreset)) return false
    if (!s) return true
    return (
      r.display_id.toLowerCase().includes(s) ||
      r.driver.name.toLowerCase().includes(s) ||
      (r.notes?.toLowerCase().includes(s) ?? false) ||
      (r.maintenance_requested?.toLowerCase().includes(s) ?? false) ||
      (r.fuel_requested?.toLowerCase().includes(s) ?? false) ||
      (r.inventory_requested?.toLowerCase().includes(s) ?? false)
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

async function mockGetMetrics(
  query: Omit<RequestListQuery, 'status' | 'page' | 'pageSize'>,
): Promise<RequestMetrics> {
  await delay(180)
  const base: RequestListQuery = {
    ...query,
    status: 'all',
    page: 1,
    pageSize: mockStore.length || 1,
  }
  return metricsFromList(filterRequests(mockStore, base))
}

export async function getRequestMetrics(
  query: Omit<RequestListQuery, 'status' | 'page' | 'pageSize'>,
): Promise<RequestMetrics> {
  if (USE_MOCK_REQUEST_API) {
    return mockGetMetrics(query)
  }
  void query
  throw new Error('getRequestMetrics: wire to GET /requests/metrics')
}

async function mockListRequests(query: RequestListQuery): Promise<PaginatedResult<FleetRequest>> {
  await delay(320)
  const filtered = filterRequests(mockStore, query)
  const total = filtered.length
  const start = (query.page - 1) * query.pageSize
  const items = filtered.slice(start, start + query.pageSize)
  return { items, total, page: query.page, pageSize: query.pageSize }
}

async function httpListRequests(_query: RequestListQuery): Promise<PaginatedResult<FleetRequest>> {
  void _query
  throw new Error('httpListRequests: implement or set VITE_USE_MOCK_REQUEST_API=true.')
}

export async function listRequests(
  query: RequestListQuery,
): Promise<PaginatedResult<FleetRequest>> {
  if (USE_MOCK_REQUEST_API) {
    return mockListRequests(query)
  }
  return httpListRequests(query)
}

async function mockSetStatus(id: string, status: RequestStatus) {
  await delay(450)
  const idx = mockStore.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Request not found')
  const next: FleetRequest = { ...mockStore[idx]!, status }
  mockStore = [...mockStore.slice(0, idx), next, ...mockStore.slice(idx + 1)]
  return next
}

export async function approveRequestApi(requestId: string): Promise<FleetRequest> {
  if (USE_MOCK_REQUEST_API) {
    return mockSetStatus(requestId, 'approved')
  }
  void requestId
  throw new Error('approveRequestApi: wire to POST /requests/:id/approve')
}

export async function rejectRequestApi(requestId: string, reason: string): Promise<FleetRequest> {
  if (USE_MOCK_REQUEST_API) {
    void reason
    return mockSetStatus(requestId, 'rejected')
  }
  void requestId
  void reason
  throw new Error('rejectRequestApi: wire to POST /requests/:id/reject')
}

export async function listRequestFilterDrivers(): Promise<Array<{ id: string; name: string }>> {
  if (USE_MOCK_REQUEST_API) {
    await delay(80)
    const map = new Map<string, string>()
    for (const r of mockStore) {
      map.set(r.driver.id, r.driver.name)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  throw new Error('listRequestFilterDrivers: wire to GET /drivers or tenant roster')
}

