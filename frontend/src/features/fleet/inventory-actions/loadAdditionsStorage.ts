/** Cumulative quantities from successful POST /inventory/load (client cache per vehicle/trip). */

export interface LoadAdditionProduct {
  product_id: number
  product_name: string
  /** Running total loaded for this vehicle/trip session */
  quantity: number
}

interface StoredPayload {
  car_id: number
  trip_id: number | null
  /** keyed by product id string */
  totals: Record<string, { product_name: string; quantity: number }>
}

function key(carId: number, tripId: number | null): string {
  return `fleet:load-additions:v1:${carId}:${tripId ?? 'no-trip'}`
}

export function readLoadAdditionsMap(carId: number, tripId: number | null): Map<number, LoadAdditionProduct> {
  const out = new Map<number, LoadAdditionProduct>()
  try {
    const raw = localStorage.getItem(key(carId, tripId))
    if (!raw) return out
    const parsed = JSON.parse(raw) as StoredPayload
    if (!parsed?.totals || typeof parsed.totals !== 'object') return out
    for (const [k, v] of Object.entries(parsed.totals)) {
      const id = Number(k)
      if (!Number.isFinite(id)) continue
      if (!v || typeof v.quantity !== 'number' || !Number.isFinite(v.quantity)) continue
      out.set(id, {
        product_id: id,
        product_name: typeof v.product_name === 'string' ? v.product_name : `Product #${id}`,
        quantity: v.quantity,
      })
    }
  } catch {
    /* ignore */
  }
  return out
}

export function mergeLoadAdditionsBatch(
  carId: number,
  tripId: number | null,
  batch: Array<{ product_id: number; product_name: string; quantity: number }>,
): void {
  if (batch.length === 0) return
  try {
    const map = readLoadAdditionsMap(carId, tripId)
    for (const row of batch) {
      const prev = map.get(row.product_id)
      const nextQty = (prev?.quantity ?? 0) + row.quantity
      map.set(row.product_id, {
        product_id: row.product_id,
        product_name: row.product_name || prev?.product_name || `Product #${row.product_id}`,
        quantity: nextQty,
      })
    }
    const totals: StoredPayload['totals'] = {}
    for (const p of map.values()) {
      totals[String(p.product_id)] = { product_name: p.product_name, quantity: p.quantity }
    }
    const payload: StoredPayload = { car_id: carId, trip_id: tripId, totals }
    localStorage.setItem(key(carId, tripId), JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearLoadAdditions(carId: number, tripId: number | null): void {
  try {
    localStorage.removeItem(key(carId, tripId))
  } catch {
    /* ignore */
  }
}
