import type {
  CapacityFilter,
  FleetVehicle,
  StatusFilter,
} from '@/features/fleet/types'

export function matchesCapacity(
  vehicle: FleetVehicle,
  capacity: CapacityFilter,
): boolean {
  if (capacity === 'all') return true
  const p = vehicle.capacityPercent
  if (capacity === 'lt50') return p < 50
  if (capacity === '50to90') return p >= 50 && p <= 90
  return p > 90
}

export function matchesStatus(
  vehicle: FleetVehicle,
  status: StatusFilter,
): boolean {
  if (status === 'all') return true
  return vehicle.operationalStatus === status
}

export function matchesSearch(
  vehicle: FleetVehicle,
  query: string,
  driverOverrides: Record<string, string>,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const driver =
    driverOverrides[vehicle.id] ??
    (vehicle.driverName === null ? 'Unassigned' : vehicle.driverName)
  return (
    vehicle.model.toLowerCase().includes(q) ||
    vehicle.plate.toLowerCase().includes(q) ||
    driver.toLowerCase().includes(q)
  )
}

export function filterFleetVehicles(
  vehicles: FleetVehicle[],
  query: string,
  status: StatusFilter,
  capacity: CapacityFilter,
  driverOverrides: Record<string, string>,
): FleetVehicle[] {
  return vehicles.filter(
    (v) =>
      matchesSearch(v, query, driverOverrides) &&
      matchesStatus(v, status) &&
      matchesCapacity(v, capacity),
  )
}
