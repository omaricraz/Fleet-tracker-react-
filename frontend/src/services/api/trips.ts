import { apiRequest } from './client'
import { toQueryString } from './queryString'
import type { TripDetailData, TripListItem } from './types'

export interface ListTripsQuery {
  status?: 'active' | 'closed'
  driver_id?: number
  car_id?: number
}

export function listTrips(query: ListTripsQuery = {}): Promise<TripListItem[]> {
  const q = toQueryString({
    status: query.status,
    driver_id: query.driver_id,
    car_id: query.car_id,
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
