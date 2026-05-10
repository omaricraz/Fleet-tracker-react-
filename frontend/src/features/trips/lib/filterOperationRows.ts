import type { TripOperationRow } from '@/features/trips/lib/tripOperationsData'
import type { TripOperationsFilters } from '@/features/trips/operations/types'

function rowMatchesKpi(row: TripOperationRow, key: string | null): boolean {
  if (!key) return true
  switch (key) {
    case 'active':
      return row.status !== 'completed'
    case 'closed':
      return row.status === 'completed'
    case 'revenue':
      return true
    case 'pending':
      return row.pendingRequests > 0
    case 'alerts':
      return row.hasAlert
    default:
      return true
  }
}

export function filterTripOperationRows(
  rows: TripOperationRow[],
  filters: TripOperationsFilters,
  kpiFilterKey: string | null,
): TripOperationRow[] {
  const zoneNeedle = filters.zone.trim().toLowerCase()
  return rows.filter((row) => {
    if (zoneNeedle && !row.zone.toLowerCase().includes(zoneNeedle)) return false
    return rowMatchesKpi(row, kpiFilterKey)
  })
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

export function exportOperationsToCsv(rows: TripOperationRow[]): void {
  const headers = [
    'Trip',
    'Status',
    'Zone',
    'Driver',
    'Vehicle',
    'Revenue',
    'Units sold',
    'Pending requests',
    'Alert',
    'Stock value',
  ]
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.displayId,
        r.status,
        r.zone,
        r.driverName,
        r.vehicleLabel,
        r.revenue.toFixed(2),
        String(r.unitsSold),
        String(r.pendingRequests),
        r.hasAlert ? 'yes' : 'no',
        r.stockValue != null ? r.stockValue.toFixed(2) : '',
      ]
        .map((c) => csvEscape(String(c)))
        .join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trip-operations-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
