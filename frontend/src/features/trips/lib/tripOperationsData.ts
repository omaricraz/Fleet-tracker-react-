import { mapUiStatusFromRaw } from '@/features/trips/lib/mapTrip'
import type { OperationsKpiCard } from '@/features/trips/operations/types'
import type { TripStatus } from '@/features/trips/types'
import type { FleetRequestApiRecord } from '@/services/api/requests'
import type {
  CarResource,
  DriverResource,
  FleetSnapshotRow,
  ProductResource,
  SaleRecord,
  TripListItem,
  ZoneResource,
} from '@/services/api/types'

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

export interface TripOperationRow {
  id: string
  displayId: string
  status: TripStatus
  zone: string
  driverName: string
  driverId: number | null
  vehicleLabel: string
  carId: number | null
  revenue: number
  unitsSold: number
  pendingRequests: number
  hasAlert: boolean
  stockValue: number | null
}

export function aggregateSalesByTrip(sales: SaleRecord[]): Map<number, { revenue: number; unitsSold: number }> {
  const m = new Map<number, { revenue: number; unitsSold: number }>()
  for (const s of sales) {
    const tid = s.trip_id
    if (tid == null) continue
    const tripId = Number(tid)
    if (!Number.isInteger(tripId)) continue
    const prev = m.get(tripId) ?? { revenue: 0, unitsSold: 0 }
    prev.revenue += Number.parseFloat(String(s.total_price ?? 0)) || 0
    prev.unitsSold += Number(s.quantity ?? 0) || 0
    m.set(tripId, prev)
  }
  return m
}

export function countPendingRequestsByDriver(requests: FleetRequestApiRecord[]): Map<number, number> {
  const m = new Map<number, number>()
  for (const r of requests) {
    const st = String(r.status ?? '').toLowerCase()
    if (st !== 'pending') continue
    const did = r.driver_id
    if (did == null || !Number.isInteger(Number(did))) continue
    const id = Number(did)
    m.set(id, (m.get(id) ?? 0) + 1)
  }
  return m
}

function carIdsFromAlerts(alerts: Record<string, unknown> | undefined): Set<number> {
  const ids = new Set<number>()
  if (!alerts) return ids
  const keys = ['low_stock', 'zero_stock', 'negative_variance_recent', 'cars', 'items'] as const
  for (const k of keys) {
    const arr = alerts[k as string]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (item && typeof item === 'object' && 'car_id' in item) {
        const id = Number((item as { car_id: unknown }).car_id)
        if (Number.isInteger(id) && id > 0) ids.add(id)
      }
    }
  }
  return ids
}

export function computeCarStockValues(
  rows: FleetSnapshotRow[] | undefined,
  productsById: Map<number, ProductResource>,
): Map<number, number> | null {
  if (!rows?.length) return null
  const m = new Map<number, number>()
  for (const row of rows) {
    let val = 0
    for (const it of row.items) {
      const price = Number.parseFloat(String(productsById.get(it.product_id)?.price ?? 0)) || 0
      const qty = Number.parseFloat(String(it.quantity)) || 0
      val += price * qty
    }
    m.set(row.car_id, val)
  }
  return m
}

export function computeFleetOperationsKpis(input: {
  trips: TripListItem[]
  sales: SaleRecord[]
  alerts: Record<string, unknown> | undefined
  pendingRequestCount: number
}): OperationsKpiCard[] {
  const active = input.trips.filter((t) => pickString(t.status).toLowerCase() !== 'closed').length
  const closed = input.trips.length - active
  let revenue = 0
  for (const s of input.sales) {
    revenue += Number.parseFloat(String(s.total_price ?? 0)) || 0
  }
  const alertCount = carIdsFromAlerts(input.alerts).size

  return [
    { key: 'active', title: 'Active trips', value: String(active), subtitle: 'In progress' },
    { key: 'closed', title: 'Closed trips', value: String(closed), subtitle: 'In current list' },
    { key: 'revenue', title: 'Sales total', value: `$${revenue.toFixed(2)}`, subtitle: 'Date-filtered window' },
    {
      key: 'pending',
      title: 'Pending requests',
      value: String(input.pendingRequestCount),
      subtitle: 'Awaiting action',
    },
    { key: 'alerts', title: 'Alert rows', value: String(alertCount), subtitle: 'From inventory API' },
  ]
}

export function mapTripListItemToOperationRow(
  trip: TripListItem,
  salesByTrip: Map<number, { revenue: number; unitsSold: number }>,
  pendingByDriver: Map<number, number>,
  alerts: Record<string, unknown> | undefined,
  stockByCar: Map<number, number> | null,
): TripOperationRow {
  const id = String(trip.id)
  const status = mapUiStatusFromRaw(pickString(trip.status))

  const driverObj =
    trip.driver && typeof trip.driver === 'object' && 'full_name' in trip.driver
      ? (trip.driver as DriverResource)
      : null
  const driverName = driverObj ? pickString(driverObj.full_name) : '—'
  const driverId = driverObj?.id != null && Number.isInteger(Number(driverObj.id)) ? Number(driverObj.id) : null

  const car =
    trip.car && typeof trip.car === 'object' && 'model' in trip.car ? (trip.car as CarResource) : null
  const vehicleLabel = car ? `${car.model} · ${car.plate_number}` : '—'
  const carId = car?.id != null && Number.isInteger(Number(car.id)) ? Number(car.id) : null

  const zone =
    trip.zone && typeof trip.zone === 'object' && 'name' in trip.zone
      ? pickString((trip.zone as ZoneResource).name)
      : pickString(trip.destination) || '—'

  const sale = salesByTrip.get(trip.id)
  const revenue = sale?.revenue ?? 0
  const unitsSold = sale?.unitsSold ?? 0
  const pendingRequests = driverId != null ? (pendingByDriver.get(driverId) ?? 0) : 0

  const alertCars = carIdsFromAlerts(alerts)
  const hasAlert = carId != null && alertCars.has(carId)
  const stockValue = carId != null && stockByCar ? (stockByCar.get(carId) ?? null) : null

  return {
    id,
    displayId: `Trip #${trip.id}`,
    status,
    zone,
    driverName,
    driverId,
    vehicleLabel,
    carId,
    revenue,
    unitsSold,
    pendingRequests,
    hasAlert,
    stockValue,
  }
}
