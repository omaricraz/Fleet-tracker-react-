import type {
  CarResource,
  DriverResource,
  TripDetailData,
  TripListItem,
  TripTimelineEvent,
  ZoneResource,
} from '@/services/api/types'
import type {
  InventoryRow,
  SalesRow,
  TimelineEntry,
  TripKpiSnapshot,
  TripStatus,
  TripSummary,
  TripWorkspaceDetail,
} from '@/features/trips/types'

function pickString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

export function mapUiStatusFromRaw(apiStatus: string): TripStatus {
  const s = apiStatus.toLowerCase()
  if (s === 'closed') return 'completed'
  if (s === 'delayed') return 'delayed'
  return 'active'
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function normalizeClockLabel(value: unknown): string | null {
  const text = pickString(value).trim()
  if (!text) return null

  const hhmm = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/)
  if (hhmm) {
    const hours = Number(hhmm[1])
    const minutes = Number(hhmm[2])
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const meridiem = text.match(/^(\d{1,2})(?::([0-5]\d))?\s*([AaPp][Mm])$/)
  if (meridiem) {
    const rawHour = Number(meridiem[1])
    const minutes = Number(meridiem[2] ?? '0')
    if (rawHour >= 1 && rawHour <= 12) {
      const isPm = meridiem[3].toLowerCase() === 'pm'
      const hour24 = rawHour % 12 + (isPm ? 12 : 0)
      return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  return null
}

function formatClockDisplay(value: string): string {
  const [hourPart, minutePart] = value.split(':')
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function eventVariant(eventType: string): TimelineEntry['variant'] {
  const t = eventType.toLowerCase()
  if (t.includes('sale')) return 'sale'
  if (t.includes('start') || t.includes('open') || t.includes('depart')) return 'depart'
  if (t.includes('load') || t.includes('inventory')) return 'shipping'
  return 'transit'
}

export function mapTimeline(events: TripTimelineEvent[]): TimelineEntry[] {
  return events.map((e, idx) => {
    const eventType = pickString(e.event_type)
    const subtitleParts = [
      pickString(e.quantity) && `Qty: ${pickString(e.quantity)}`,
      pickString(e.amount) && `Amt: ${pickString(e.amount)}`,
    ].filter(Boolean)
    return {
      id: String(e.id ?? idx),
      time: formatShortDate(e.created_at),
      title: eventType.replace(/_/g, ' ') || 'event',
      subtitle: subtitleParts.join(' · ') || '—',
      variant: eventVariant(eventType),
    }
  })
}

export function mapTripListItemToSummary(trip: TripListItem): TripSummary {
  const id = String(trip.id)
  const status = mapUiStatusFromRaw(pickString(trip.status))
  const driver =
    trip.driver && typeof trip.driver === 'object' && 'full_name' in trip.driver
      ? pickString((trip.driver as unknown as DriverResource).full_name)
      : '—'
  const car =
    trip.car && typeof trip.car === 'object' && 'model' in trip.car
      ? (trip.car as CarResource)
      : null
  const vehicleLabel = car ? `${car.model} · ${car.plate_number}` : '—'
  const zone =
    trip.zone && typeof trip.zone === 'object' && 'name' in trip.zone
      ? pickString((trip.zone as ZoneResource).name)
      : pickString(trip.destination) || '—'

  const start = trip.start_date != null ? pickString(trip.start_date) : ''
  const end = trip.end_date != null ? pickString(trip.end_date) : ''
  const timeLabel = end ? formatShortDate(end) : start ? `Started ${formatShortDate(start)}` : '—'

  const borderAccent: TripSummary['borderAccent'] =
    status === 'completed' ? 'completed' : status === 'delayed' ? 'delayed' : 'primary'

  return {
    id,
    displayId: `Trip #${trip.id}`,
    status,
    timeLabel,
    zone,
    driverName: driver,
    vehicleLabel,
    summaryAmount: status === 'active' ? '—' : 'Closed',
    summaryDistance: zone,
    borderAccent,
  }
}

export function mapTripKpis(trips: TripListItem[]): TripKpiSnapshot {
  const active = trips.filter((t) => pickString(t.status).toLowerCase() !== 'closed').length
  const closedToday = 0
  return {
    activeTrips: { value: String(active), delta: '' },
    loadingTrucks: { value: '—', suffix: 'API' },
    salesToday: { value: String(closedToday) },
    revenueToday: { value: '—' },
  }
}

export function mapTripDetailToWorkspace(detail: TripDetailData): TripWorkspaceDetail {
  const trip = detail.trip
  const departureTime = normalizeClockLabel((trip as { departure?: unknown }).departure)
  const arrivalTime = normalizeClockLabel((trip as { arrival_time?: unknown }).arrival_time)
  const routeMarkers: TimelineEntry[] = []
  if (arrivalTime) {
    routeMarkers.push({
      id: 'trip-arrival',
      time: formatClockDisplay(arrivalTime),
      title: 'Arrival',
      subtitle: departureTime
        ? `Arrives before departure at ${formatClockDisplay(departureTime)}`
        : 'Planned/recorded arrival time',
      variant: 'transit',
    })
  }
  if (departureTime) {
    routeMarkers.push({
      id: 'trip-departure',
      time: formatClockDisplay(departureTime),
      title: 'Departure',
      subtitle: arrivalTime
        ? `Departs after arrival at ${formatClockDisplay(arrivalTime)}`
        : 'Trip departure time',
      variant: 'depart',
    })
  }

  const id = pickString(trip.id)
  const status = mapUiStatusFromRaw(pickString(trip.status))
  const driver =
    detail.driver && typeof detail.driver === 'object' && 'full_name' in detail.driver
      ? pickString((detail.driver as unknown as DriverResource).full_name)
      : '—'
  const car =
    detail.car && typeof detail.car === 'object' && 'model' in detail.car
      ? (detail.car as CarResource)
      : null
  const vehicleLabel = car ? `${car.model} · ${car.plate_number}` : '—'

  const salesByProduct = new Map<number, number>()
  const priceByProduct = new Map<number, string>()
  for (const s of detail.sales_summary) {
    salesByProduct.set(s.product_id, Number(s.quantity))
    priceByProduct.set(s.product_id, pickString(s.total_price))
  }

  const inventory: InventoryRow[] = detail.inventory_summary.on_hand.map((row) => {
    const pid = row.product_id
    const sold = salesByProduct.get(pid) ?? 0
    return {
      id: String(pid),
      product: row.product_name,
      opening: 0,
      loaded: 0,
      sales: sold,
      closing: Number(row.quantity),
      variance: 0,
    }
  })

  const sales: SalesRow[] = detail.sales_summary.map((s, i) => ({
    id: `${s.product_id}-${i}`,
    product:
      detail.inventory_summary.on_hand.find((h) => h.product_id === s.product_id)?.product_name ??
      `#${s.product_id}`,
    qty: String(s.quantity),
    amount: pickString(s.total_price),
  }))

  const revenue = detail.sales_summary
    .reduce((acc, s) => acc + (Number.parseFloat(String(s.total_price)) || 0), 0)
    .toFixed(2)

  return {
    tripId: id,
    displayId: `Trip #${id}`,
    status,
    revenue: `$${revenue}`,
    distance: '—',
    customers: detail.sales_summary.length,
    driverName: driver,
    vehicleLabel,
    timeline: [...routeMarkers, ...mapTimeline(detail.timeline)],
    inventory,
    sales,
  }
}

export function extractUniqueZones(trips: TripListItem[]): string[] {
  const set = new Set<string>()
  for (const t of trips) {
    if (t.zone && typeof t.zone === 'object' && 'name' in t.zone) {
      set.add(pickString((t.zone as ZoneResource).name))
    } else if (t.destination) {
      set.add(pickString(t.destination))
    }
  }
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b))
}

export function extractUniqueDrivers(trips: TripListItem[]): string[] {
  const set = new Set<string>()
  for (const t of trips) {
    if (t.driver && typeof t.driver === 'object' && 'full_name' in t.driver) {
      set.add(pickString((t.driver as DriverResource).full_name))
    }
  }
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b))
}
