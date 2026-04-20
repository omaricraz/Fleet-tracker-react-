import {
  ChevronDown,
  ChevronUp,
  Fuel,
  Package,
  Truck,
  Wrench,
} from 'lucide-react'

import {
  DataTableBody,
  DataTableHead,
  DataTableShell,
} from '@/components/DataTableShell'
import { StatusBadge } from '@/components/StatusBadge'
import type { FleetDetailTab, FleetVehicle } from '@/features/fleet/types'
import { MOCK_DRIVER_OPTIONS } from '@/features/fleet/mockFleetData'
import { cn } from '@/lib/utils'

function toneToBadge(
  tone: 'success' | 'warning' | 'neutral' | 'danger',
  label: string,
) {
  const t =
    tone === 'success'
      ? 'success'
      : tone === 'warning'
        ? 'warning'
        : tone === 'danger'
          ? 'danger'
          : 'neutral'
  return <StatusBadge label={label} tone={t} />
}

interface FleetVehicleCardProps {
  vehicle: FleetVehicle
  expanded: boolean
  onToggle: () => void
  activeTab: FleetDetailTab
  onTabChange: (tab: FleetDetailTab) => void
  driverDisplay: string
  onDriverChange: (value: string) => void
}

function VehicleIcon({ vehicle }: { vehicle: FleetVehicle }) {
  const isMaintenance = vehicle.operationalStatus === 'maintenance'
  const Icon = isMaintenance ? Wrench : Truck
  const wrap = cn(
    'flex size-14 shrink-0 items-center justify-center rounded-xl',
    isMaintenance
      ? 'bg-destructive/15 text-destructive'
      : vehicle.metricVariant === 'active_full'
        ? 'bg-primary-container text-primary-foreground'
        : vehicle.metricVariant === 'available_bars'
          ? 'bg-muted text-primary'
          : 'bg-surface-low text-primary',
  )
  return (
    <div className={wrap}>
      <Icon className="size-7" strokeWidth={2} />
    </div>
  )
}

function MetricsBlock({ vehicle }: { vehicle: FleetVehicle }) {
  const { metricVariant } = vehicle

  if (metricVariant === 'active_full') {
    return (
      <div className="grid w-full flex-grow grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Volume
          </div>
          <div className="text-sm font-bold text-primary">{vehicle.volumeLabel}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Weight
          </div>
          <div className="text-sm font-bold text-primary">{vehicle.weightLabel}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Efficiency
          </div>
          <div className="text-sm font-bold text-primary">{vehicle.efficiencyLabel}</div>
        </div>
      </div>
    )
  }

  if (metricVariant === 'available_bars') {
    return (
      <div className="grid w-full flex-grow grid-cols-1 gap-8 opacity-60 md:grid-cols-2 md:gap-12">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>
              Volume:{' '}
              <strong className="text-primary">{vehicle.volumeLabel}</strong>
            </span>
            <span>0%</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>
              Weight:{' '}
              <strong className="text-primary">{vehicle.weightLabel}</strong>
            </span>
            <span>0%</span>
          </div>
        </div>
      </div>
    )
  }

  if (metricVariant === 'loading_bars') {
    return (
      <div className="grid w-full flex-grow grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>
              Volume:{' '}
              <strong className="text-primary">{vehicle.volumeLabel}</strong>
            </span>
            <span>{vehicle.capacityPercent}%</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>
              Weight:{' '}
              <strong className="text-primary">{vehicle.weightLabel}</strong>
            </span>
            <span>18%</span>
          </div>
        </div>
      </div>
    )
  }

  /* maintenance_bars — text only (no volume/weight progress bars) */
  return (
    <div className="grid w-full flex-grow grid-cols-1 gap-8 opacity-60 md:grid-cols-2 md:gap-12">
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>
            Volume:{' '}
            <strong className="text-primary">{vehicle.volumeLabel}</strong>
          </span>
          <span>--</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>
            {vehicle.volumeSecondary?.includes('Awaiting') ? (
              <strong className="text-primary">{vehicle.volumeSecondary}</strong>
            ) : (
              <>
                Condition:{' '}
                <strong className="text-primary">{vehicle.volumeSecondary}</strong>
              </>
            )}
          </span>
          <span>{vehicle.weightSecondary}</span>
        </div>
      </div>
    </div>
  )
}

export function FleetVehicleCard({
  vehicle,
  expanded,
  onToggle,
  activeTab,
  onTabChange,
  driverDisplay,
  onDriverChange,
}: FleetVehicleCardProps) {
  const driverLabel =
    driverDisplay === 'Unassigned' || !driverDisplay ? 'Unassigned' : driverDisplay

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-transparent bg-surface-lowest shadow-sm transition-all hover:border-border/80',
      )}
    >
      <div className="flex flex-col items-start gap-8 p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-5 sm:min-w-[240px]">
          <VehicleIcon vehicle={vehicle} />
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-primary">{vehicle.model}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Plate: {vehicle.plate}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Trip ID:{' '}
              <span className="font-bold text-foreground">{vehicle.tripId}</span>
            </p>
          </div>
        </div>

        <div className="flex min-w-[140px] flex-col">
          <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Current Driver
          </span>
          <label className="sr-only" htmlFor={`driver-${vehicle.id}`}>
            Assign driver
          </label>
          <select
            id={`driver-${vehicle.id}`}
            value={driverDisplay === '' ? 'Unassigned' : driverLabel}
            onChange={(e) => onDriverChange(e.target.value)}
            className="w-fit max-w-full cursor-pointer appearance-none rounded-lg border-0 bg-transparent py-1 pl-2 pr-8 text-sm font-bold text-primary -ml-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring/60"
          >
            {MOCK_DRIVER_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name === 'Unassigned' ? 'Unassigned' : name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[100px] flex-col">
          <span className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Current Fuel
          </span>
          <div className="flex items-center gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-low">
              <div
                className="h-full rounded-full bg-primary-container"
                style={{ width: `${vehicle.fuelTankPercent}%` }}
              />
            </div>
            <span className="text-sm font-bold text-primary">{vehicle.fuelLiters}L</span>
          </div>
        </div>

        <MetricsBlock vehicle={vehicle} />

        <div className="shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            View Details
            {expanded ? (
              <ChevronUp className="size-4 shrink-0" />
            ) : (
              <ChevronDown className="size-4 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border/60 bg-surface-low">
          <div className="flex gap-8 border-b border-border/40 px-6 pt-4 md:px-8">
            <button
              type="button"
              onClick={() => onTabChange('fuel')}
              className={cn(
                'flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors',
                activeTab === 'fuel'
                  ? 'border-primary text-primary'
                  : 'border-transparent font-semibold text-muted-foreground hover:text-primary',
              )}
            >
              <Fuel className="size-4" />
              Fuel History
            </button>
            <button
              type="button"
              onClick={() => onTabChange('maintenance')}
              className={cn(
                'flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors',
                activeTab === 'maintenance'
                  ? 'border-primary text-primary'
                  : 'border-transparent font-semibold text-muted-foreground hover:text-primary',
              )}
            >
              <Wrench className="size-4" />
              Maintenance
            </button>
            <button
              type="button"
              onClick={() => onTabChange('inventory')}
              className={cn(
                'flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-colors',
                activeTab === 'inventory'
                  ? 'border-primary text-primary'
                  : 'border-transparent font-semibold text-muted-foreground hover:text-primary',
              )}
            >
              <Package className="size-4" />
              Inventory
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'fuel' ? (
              <DataTableShell>
                <DataTableHead>
                  <tr>
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Date
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Liters
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Cost/L
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Total Cost
                    </th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Status
                    </th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {vehicle.fuelHistory.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-primary-fixed/5 dark:hover:bg-primary-fixed/10"
                    >
                      <td className="px-4 py-4 font-bold text-primary md:px-6">
                        {row.date}
                      </td>
                      <td className="px-4 py-4 text-right font-medium md:px-6">
                        {row.liters}
                      </td>
                      <td className="px-4 py-4 text-right md:px-6">{row.costPerLiter}</td>
                      <td className="px-4 py-4 text-right font-bold text-primary md:px-6">
                        {row.totalCost}
                      </td>
                      <td className="px-4 py-4 text-center md:px-6">
                        {toneToBadge(row.statusTone, row.statusLabel)}
                      </td>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTableShell>
            ) : activeTab === 'maintenance' ? (
              <DataTableShell>
                <DataTableHead>
                  <tr>
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Date
                    </th>
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Type
                    </th>
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Notes
                    </th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Status
                    </th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {vehicle.maintenance.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-primary-fixed/5 dark:hover:bg-primary-fixed/10"
                    >
                      <td className="px-4 py-4 font-bold text-primary md:px-6">
                        {row.date}
                      </td>
                      <td className="px-4 py-4 md:px-6">{row.type}</td>
                      <td className="px-4 py-4 text-muted-foreground md:px-6">{row.notes}</td>
                      <td className="px-4 py-4 text-center md:px-6">
                        {toneToBadge(row.statusTone, row.statusLabel)}
                      </td>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTableShell>
            ) : (
              <DataTableShell>
                <DataTableHead>
                  <tr>
                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Product
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Quantity
                    </th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-tighter md:px-6">
                      Price
                    </th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {vehicle.inventory.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-primary-fixed/5 dark:hover:bg-primary-fixed/10"
                    >
                      <td className="px-4 py-4 font-bold text-primary md:px-6">
                        {row.product}
                      </td>
                      <td className="px-4 py-4 text-right font-medium md:px-6">
                        {row.quantity}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-primary md:px-6">
                        {row.price}
                      </td>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTableShell>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
