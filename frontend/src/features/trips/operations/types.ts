import type { WorkspaceTabId } from '@/features/trips/types'

export type OperationDrawerTabId = WorkspaceTabId

export interface TripOperationsFilters {
  search: string
  dateFrom: string
  dateTo: string
  zone: string
  driverId: string
  vehicleId: string
  tripStatus: 'all' | 'active' | 'closed'
}

export const defaultTripOperationsFilters: TripOperationsFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  zone: '',
  driverId: '',
  vehicleId: '',
  tripStatus: 'all',
}

export interface OperationsKpiCard {
  key: string
  title: string
  value: string
  subtitle?: string
}
