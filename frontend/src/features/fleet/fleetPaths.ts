/** Deep link to a single vehicle profile (not the fleet list route). */
export function fleetVehicleProfilePath(carId: number | string): string {
  return `/fleet-management/vehicles/${carId}`
}
