export type FleetOperationalStatus =
  | 'available'
  | 'active'
  | 'maintenance'
  | 'in_transit'

/** UI layout variant for the metrics row (matches design references). */
export type FleetCardMetricVariant =
  | 'active_full'
  | 'available_bars'
  | 'loading_bars'
  | 'maintenance_bars'

export type FleetDetailTab = 'fuel' | 'maintenance' | 'inventory'

export type CapacityFilter = 'all' | 'lt50' | '50to90' | 'gt90'

export type StatusFilter = 'all' | FleetOperationalStatus

export interface FuelHistoryRow {
  id: string
  date: string
  liters: string
  costPerLiter: string
  totalCost: string
  statusTone: 'success' | 'warning' | 'neutral'
  statusLabel: string
}

export interface MaintenanceRow {
  id: string
  date: string
  type: string
  notes: string
  statusTone: 'success' | 'warning' | 'danger'
  statusLabel: string
}

export interface InventoryRow {
  id: string
  product: string
  quantity: string
  price: string
}

export interface FleetVehicle {
  id: string
  model: string
  plate: string
  tripId: string
  /** null = unassigned */
  driverName: string | null
  /** For filter dropdown: maps to operational status */
  operationalStatus: FleetOperationalStatus
  /** 0–100, used for capacity bucket filter */
  capacityPercent: number
  fuelLiters: number
  fuelTankPercent: number
  metricVariant: FleetCardMetricVariant
  volumeLabel: string
  weightLabel: string
  efficiencyLabel: string
  /** Optional second row labels for maintenance card */
  volumeSecondary?: string
  weightSecondary?: string
  fuelHistory: FuelHistoryRow[]
  maintenance: MaintenanceRow[]
  inventory: InventoryRow[]
}
