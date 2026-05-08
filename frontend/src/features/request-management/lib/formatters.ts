import type { FleetRequest } from '../types'

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatRequestCreatedAt(iso: string) {
  try {
    return dateFmt.format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatLitreCost(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatRequestedSummary(request: FleetRequest) {
  if (request.type === 'fuel') {
    const litres = request.fuel_requested?.trim() || '—'
    const suffix = litres === '—' ? '' : ' L'
    return `${litres}${suffix}`
  }
  if (request.type === 'maintenance') {
    return request.maintenance_requested?.trim() || '—'
  }
  return request.inventory_requested?.trim() || '—'
}
