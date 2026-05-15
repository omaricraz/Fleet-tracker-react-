import { apiRequest } from './client'
import { toQueryString } from './queryString'
import type { TripDetailData, TripListItem } from './types'

export interface ListTripsQuery {
  status?: 'active' | 'closed'
  driver_id?: number
  car_id?: number
  zone_id?: number
  /** Inclusive ISO date (`YYYY-MM-DD`) — forwarded if the API supports it */
  date_from?: string
  /** Inclusive ISO date (`YYYY-MM-DD`) — forwarded if the API supports it */
  date_to?: string
}

export function listTrips(query: ListTripsQuery = {}): Promise<TripListItem[]> {
  const q = toQueryString({
    status: query.status,
    driver_id: query.driver_id,
    car_id: query.car_id,
    zone_id: query.zone_id,
    date_from: query.date_from,
    date_to: query.date_to,
  })
  return apiRequest<TripListItem[]>(`/trips${q}`)
}

export interface StoreTripBody {
  driver_id: number
  car_id: number
  zone_id?: number | null
  destination?: string | null
  arrival_time?: string | null
  departure?: string | null
}

export function createTrip(body: StoreTripBody): Promise<TripListItem> {
  return apiRequest<TripListItem>('/trips', { method: 'POST', body })
}

export function getTrip(tripId: number | string): Promise<TripDetailData> {
  return apiRequest<TripDetailData>(`/trips/${tripId}`)
}

export function openTrip(tripId: number | string): Promise<TripListItem> {
  return apiRequest<TripListItem>(`/trips/${tripId}/open`, { method: 'POST', body: {} })
}

export function closeTrip(tripId: number | string): Promise<TripListItem> {
  return apiRequest<TripListItem>(`/trips/${tripId}/close`, { method: 'POST', body: {} })
}

export function deleteTrip(tripId: number | string): Promise<Record<string, never>> {
  return apiRequest<Record<string, never>>(`/trips/${tripId}`, { method: 'DELETE' })
}

function coerceTripId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Unwraps GET /driver/trip/current payload into a trip list item, or null if none. */
export function parseDriverCurrentTripPayload(data: unknown): TripListItem | null {
  if (data == null) return null
  if (typeof data !== 'object') return null
  const root = data as Record<string, unknown>
  let trip: Record<string, unknown> | null = null

  if (root.trip != null && typeof root.trip === 'object') {
    trip = root.trip as Record<string, unknown>
  } else if ('id' in root || 'trip_id' in root) {
    trip = root
  }

  if (!trip) return null
  const id = coerceTripId(trip.id ?? trip.trip_id)
  if (id == null) return null
  return { ...trip, id } as TripListItem
}

export async function getDriverCurrentTrip(): Promise<TripListItem | null> {
  const data = await apiRequest<unknown>('/driver/trip/current')
  return parseDriverCurrentTripPayload(data)
}
