import type { OpeningSnapshotPayload } from './types'

function key(carId: number, tripId: number | null): string {
  return `fleet:opening-snapshot:v1:${carId}:${tripId ?? 'no-trip'}`
}

export function readOpeningSnapshot(carId: number, tripId: number | null): OpeningSnapshotPayload | null {
  try {
    const raw = localStorage.getItem(key(carId, tripId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as OpeningSnapshotPayload
    if (!parsed || !Array.isArray(parsed.lines)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeOpeningSnapshot(payload: OpeningSnapshotPayload): void {
  try {
    localStorage.setItem(key(payload.car_id, payload.trip_id), JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearOpeningSnapshot(carId: number, tripId: number | null): void {
  try {
    localStorage.removeItem(key(carId, tripId))
  } catch {
    /* ignore */
  }
}
