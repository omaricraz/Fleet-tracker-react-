import type { InventoryAlertItem, PaginationMeta, PaginatedItems } from '@/services/api/types'

const KIND_LABELS: Record<string, string> = {
  low_stock: 'Low stock',
  zero_stock: 'Zero stock',
  negative_variance_recent: 'Negative variance',
}

export function humanizeAlertKind(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Maps Laravel payload keys (`lowStock`) to canonical snake_case (`low_stock`). */
export function canonicalBucketKind(key: string): string {
  const explicit: Record<string, string> = {
    lowStock: 'low_stock',
    low_stock: 'low_stock',
    zeroStock: 'zero_stock',
    zero_stock: 'zero_stock',
    negativeVarianceRecent: 'negative_variance_recent',
    negative_variance_recent: 'negative_variance_recent',
  }
  if (explicit[key]) return explicit[key]!
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase()
}

function rowCreatedAt(row: Record<string, unknown>): string | undefined {
  const v = row.created_at ?? row.updated_at ?? row.recorded_at ?? row.detected_at
  return typeof v === 'string' ? v : undefined
}

function parseOptionalInt(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function formatQuantity(raw: unknown): string | undefined {
  if (raw == null) return undefined
  const s = String(raw).trim()
  return s.length > 0 ? s : undefined
}

function formatDetailFromBase(row: Record<string, unknown>, quantity?: string): string {
  if (typeof row.message === 'string' && row.message.trim()) return row.message.trim()
  const parts: string[] = []
  if (row.product_name != null) parts.push(String(row.product_name))
  else if (row.item != null) parts.push(String(row.item))
  const carLabel = row.car_name ?? row.plate_number ?? row.car_id
  if (carLabel != null) parts.push(`Vehicle ${String(carLabel)}`)
  if (quantity != null) parts.push(`Qty ${quantity}`)
  if (row.threshold != null) parts.push(`Threshold ${String(row.threshold)}`)
  if (row.variance != null) parts.push(`Variance ${String(row.variance)}`)
  return parts.join(' · ')
}

/** Rows produced by `InventoryService::getAlerts` inventory scan (`$base`). */
function itemFromInventoryBase(bucketKey: string, raw: Record<string, unknown>, index: number): InventoryAlertItem {
  const kind = canonicalBucketKind(bucketKey)
  const car_id = parseOptionalInt(raw.car_id)
  const product_id = parseOptionalInt(raw.product_id)
  const car_name = typeof raw.car_name === 'string' ? raw.car_name : raw.car_name != null ? String(raw.car_name) : ''
  const product_name =
    typeof raw.product_name === 'string' ? raw.product_name : raw.product_name != null ? String(raw.product_name) : ''
  const quantity = formatQuantity(raw.quantity)
  const created = rowCreatedAt(raw) ?? null
  const title = humanizeAlertKind(kind)
  const detail = formatDetailFromBase(raw, quantity)

  return {
    id: `${kind}:${index}:${String(car_id ?? '')}:${String(product_id ?? '')}:${quantity ?? ''}`,
    kind,
    title,
    detail,
    created_at: created,
    car_id,
    car_name: car_name || undefined,
    product_id,
    product_name: product_name || undefined,
    quantity,
  }
}

function formatDetail(row: Record<string, unknown>): string {
  return formatDetailFromBase(row, formatQuantity(row.quantity))
}

function normalizeFlatRow(raw: unknown, index: number): InventoryAlertItem | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const kindRaw = row.type ?? row.kind ?? row.alert_type ?? row.category ?? 'alert'
  const kind = canonicalBucketKind(String(kindRaw))
  const created = rowCreatedAt(row) ?? null
  const cid = parseOptionalInt(row.car_id)
  const pid = parseOptionalInt(row.product_id)
  const quantity = formatQuantity(row.quantity)
  const car_name =
    typeof row.car_name === 'string' ? row.car_name : row.car_name != null ? String(row.car_name) : undefined
  const product_name =
    typeof row.product_name === 'string'
      ? row.product_name
      : row.product_name != null
        ? String(row.product_name)
        : undefined

  return {
    id: String(row.id ?? `${kind}:${index}:${String(cid ?? '')}:${String(pid ?? '')}:${created ?? ''}`),
    kind,
    title: humanizeAlertKind(kind),
    detail: formatDetail(row),
    created_at: created,
    car_id: cid,
    car_name,
    product_id: pid,
    product_name,
    quantity,
  }
}

function pushKeyedBuckets(o: Record<string, unknown>, into: InventoryAlertItem[]): void {
  for (const [bucketKey, value] of Object.entries(o)) {
    if (bucketKey === 'meta' || bucketKey === 'links' || bucketKey === 'items') continue
    if (!Array.isArray(value)) continue
    const canonicalBucket = canonicalBucketKind(bucketKey)
    const isInventorySnapshotBucket = canonicalBucket === 'low_stock' || canonicalBucket === 'zero_stock'

    value.forEach((raw, index) => {
      if (!raw || typeof raw !== 'object') return
      const row = raw as Record<string, unknown>

      if (isInventorySnapshotBucket) {
        into.push(itemFromInventoryBase(bucketKey, row, index))
        return
      }

      const created = rowCreatedAt(row) ?? null
      const kind = canonicalBucket
      const cid = parseOptionalInt(row.car_id)
      const pid = parseOptionalInt(row.product_id)
      const quantity = formatQuantity(row.quantity)
      const car_name =
        typeof row.car_name === 'string' ? row.car_name : row.car_name != null ? String(row.car_name) : undefined
      const product_name =
        typeof row.product_name === 'string'
          ? row.product_name
          : row.product_name != null
            ? String(row.product_name)
            : undefined

      into.push({
        id: `${bucketKey}:${index}:${String(cid ?? '')}:${String(pid ?? '')}:${created ?? ''}`,
        kind,
        title: humanizeAlertKind(kind),
        detail: formatDetail(row),
        created_at: created,
        car_id: cid,
        car_name,
        product_id: pid,
        product_name,
        quantity,
      })
    })
  }
}

/** Flattens `InventoryService::getAlerts` buckets or a paginated `{ items }` payload into rows. */
export function normalizeInventoryAlertsPayload(data: unknown): InventoryAlertItem[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.map((raw, i) => normalizeFlatRow(raw, i)).filter((x): x is InventoryAlertItem => x != null)
  }
  if (typeof data !== 'object') return []
  const o = data as Record<string, unknown>

  if (Array.isArray(o.items)) {
    const fromItems = (o.items as unknown[])
      .map((raw, i) => normalizeFlatRow(raw, i))
      .filter((x): x is InventoryAlertItem => x != null)
    /** When Laravel sends `{ items, meta }`, do not merge buckets — empty page is valid. */
    const hasPaginatorMeta =
      'meta' in o && o.meta !== null && typeof o.meta === 'object' && !Array.isArray(o.meta)
    if (fromItems.length > 0 || hasPaginatorMeta) return fromItems
  }

  const combined: InventoryAlertItem[] = []
  pushKeyedBuckets(o, combined)
  return combined
}

function readNonNegativeInt(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return Math.trunc(raw)
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 0) return n
  }
  return undefined
}

/** Normalizes Laravel `items` + `meta` pagination, otherwise flattens legacy buckets / arrays and slices by page. */
export function normalizePaginatedInventoryAlertsResponse(
  data: unknown,
  query: { page: number; per_page: number },
): PaginatedItems<InventoryAlertItem> {
  const requestedPage = Math.max(1, query.page)
  const perPage = Math.max(1, query.per_page)

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>
    const metaRaw =
      'meta' in o && o.meta !== null && typeof o.meta === 'object' && !Array.isArray(o.meta)
        ? (o.meta as Record<string, unknown>)
        : null
    const total = metaRaw ? readNonNegativeInt(metaRaw.total) : undefined

    if (metaRaw !== null && total !== undefined && Array.isArray(o.items)) {
      const items = (o.items as unknown[])
        .map((raw, i) => normalizeFlatRow(raw, i))
        .filter((x): x is InventoryAlertItem => x != null)
      const resolvedPerPage = Math.max(1, readNonNegativeInt(metaRaw.per_page) ?? perPage)
      const meta: PaginationMeta = {
        total,
        current_page: Math.max(1, readNonNegativeInt(metaRaw.current_page) ?? requestedPage),
        per_page: resolvedPerPage,
        last_page: Math.max(
          1,
          readNonNegativeInt(metaRaw.last_page) ??
            Math.max(1, Math.ceil(total / resolvedPerPage)),
        ),
      }
      return { items, meta }
    }
  }

  const allSorted = sortInventoryAlertsForDisplay(normalizeInventoryAlertsPayload(data))
  const flatTotal = allSorted.length
  const lastPage = Math.max(1, Math.ceil(flatTotal / perPage))
  const safePage = Math.min(requestedPage, lastPage)
  const start = (safePage - 1) * perPage

  return {
    items: allSorted.slice(start, start + perPage),
    meta: {
      total: flatTotal,
      current_page: safePage,
      per_page: perPage,
      last_page: lastPage,
    },
  }
}

/** Keeps alerts whose `created_at` falls within the window; rows without a timestamp stay visible (snapshot alerts). */
export function filterAlertsWithinHours(items: InventoryAlertItem[], hours: number): InventoryAlertItem[] {
  const ms = hours * 60 * 60 * 1000
  const cutoff = Date.now() - ms
  return items.filter((a) => {
    if (!a.created_at) return true
    const t = Date.parse(a.created_at)
    if (Number.isNaN(t)) return true
    return t >= cutoff
  })
}

function severityRank(kind: string): number {
  if (kind === 'zero_stock') return 0
  if (kind === 'low_stock') return 1
  return 2
}

/** Table / bell ordering: zero stock first, then low stock, then car / product. */
export function sortInventoryAlertsForDisplay(items: InventoryAlertItem[]): InventoryAlertItem[] {
  return [...items].sort((a, b) => {
    const sr = severityRank(a.kind) - severityRank(b.kind)
    if (sr !== 0) return sr
    const ta = a.created_at ? Date.parse(a.created_at) : NaN
    const tb = b.created_at ? Date.parse(b.created_at) : NaN
    const na = Number.isNaN(ta) ? 0 : ta
    const nb = Number.isNaN(tb) ? 0 : tb
    if (nb !== na) return nb - na
    const car = (a.car_name ?? '').localeCompare(b.car_name ?? '', undefined, { sensitivity: 'base' })
    if (car !== 0) return car
    return (a.product_name ?? '').localeCompare(b.product_name ?? '', undefined, { sensitivity: 'base' })
  })
}
