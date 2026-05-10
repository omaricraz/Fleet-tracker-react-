import type { CarResource } from '@/services/api/types'
import type { FleetVehicle } from '@/features/fleet/types'

function formatCapacityLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return String(numeric)
}

function formatDateLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ApprovedFuelInput {
  id: string
  createdAt?: string
  liters?: string | null
  cost?: number | null
}

interface ApprovedMaintenanceInput {
  id: string
  createdAt?: string
  detail?: string | null
  notes?: string | null
}

interface InventorySnapshotInput {
  id: string
  product: string
  quantity: string
}

interface MapCarFleetContext {
  latestApprovedFuel?: ApprovedFuelInput | null
  latestApprovedMaintenance?: ApprovedMaintenanceInput | null
  inventorySnapshot?: InventorySnapshotInput[]
}

export function mapCarToFleetVehicle(
  car: CarResource,
  index: number,
  context: MapCarFleetContext = {},
): FleetVehicle {
  const latestFuel = context.latestApprovedFuel
  const litersValue = Number(latestFuel?.liters ?? 0)
  const liters = Number.isFinite(litersValue) && litersValue > 0 ? litersValue : 0
  const fuelPercent = Math.max(0, Math.min(100, Math.round(liters)))
  const costPerLiter =
    latestFuel?.cost != null && liters > 0 ? latestFuel.cost / liters : null

  const fuelHistory = latestFuel
    ? [
        {
          id: latestFuel.id,
          date: formatDateLabel(latestFuel.createdAt),
          liters: `${latestFuel.liters ?? '—'} L`,
          costPerLiter: costPerLiter == null ? '—' : `$${costPerLiter.toFixed(2)}`,
          totalCost:
            latestFuel.cost == null ? '—' : `$${latestFuel.cost.toFixed(2)}`,
          statusTone: 'success' as const,
          statusLabel: 'Approved',
        },
      ]
    : []

  const latestMaintenance = context.latestApprovedMaintenance
  const maintenance = latestMaintenance
    ? [
        {
          id: latestMaintenance.id,
          date: formatDateLabel(latestMaintenance.createdAt),
          type: latestMaintenance.detail?.trim() || 'Maintenance',
          notes: latestMaintenance.notes?.trim() || '—',
          statusTone: 'success' as const,
          statusLabel: 'Approved',
        },
      ]
    : []

  const inventory =
    context.inventorySnapshot?.map((row) => ({
      id: row.id,
      product: row.product,
      quantity: row.quantity,
      price: '—',
    })) ?? []

  return {
    id: String(car.id),
    model: car.model,
    plate: car.plate_number,
    tripId: '—',
    driverName: null,
    operationalStatus: 'available',
    capacityPercent: 45 + (index % 5) * 10,
    fuelLiters: liters,
    fuelTankPercent: fuelPercent,
    metricVariant: 'available_bars',
    volumeLabel: formatCapacityLabel(car.overall_volume_capacity),
    weightLabel: formatCapacityLabel(car.overall_weight_capacity),
    efficiencyLabel: '—',
    fuelHistory,
    maintenance,
    inventory,
  }
}
