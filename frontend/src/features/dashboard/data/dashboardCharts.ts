/**
 * Mock chart series for dashboard visualizations.
 * Shape matches a likely future API contract.
 */

export interface WeeklyRevenuePoint {
  day: string
  /** Normalized 0–100 for SVG Y axis (100 = bottom, 0 = top) */
  y: number
}

/** Polyline points in viewBox "0 0 100 100" — matches design reference. */
export const weeklyRevenuePolylinePoints = '0,90 15,70 30,75 45,40 60,50 75,20 90,30 100,10'

/** Filled area clip path polygon (percent-based) aligned with the line. */
export const weeklyRevenueAreaClipPath =
  'polygon(0 90%, 15% 70%, 30% 75%, 45% 40%, 60% 50%, 75% 20%, 90% 30%, 100% 10%, 100% 100%, 0 100%)'

export const weeklyRevenueAxisDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export interface ZoneSlice {
  id: string
  label: string
  percent: number
  /** CSS color */
  color: string
}

export const zoneDistribution: ZoneSlice[] = [
  { id: 'north', label: 'North', percent: 45, color: 'var(--primary)' },
  { id: 'south', label: 'South', percent: 30, color: '#d5e3fc' },
  { id: 'east-west', label: 'East/West', percent: 25, color: 'var(--surface-high)' },
]

export function zoneConicGradient(slices: ZoneSlice[]): string {
  let acc = 0
  const parts = slices.map((s) => {
    const start = acc
    acc += s.percent
    return `${s.color} ${start}% ${acc}%`
  })
  return `conic-gradient(${parts.join(', ')})`
}
