import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getInventoryAlerts, listInventory } from '@/services/api/inventory'
import { listProducts } from '@/services/api/products'
import { listFleetRequests } from '@/services/api/requests'
import { listSales } from '@/services/api/sales'
import { listTrips, type ListTripsQuery } from '@/services/api/trips'
import type { ProductResource } from '@/services/api/types'

export interface UseTripOperationsQueriesArgs {
  listParams: ListTripsQuery
  salesDateFrom: string
  salesDateTo: string
  liveMode: boolean
  loadFleetSnapshot: boolean
  loadAlerts: boolean
  loadPendingRequests: boolean
}

export function useTripOperationsQueries({
  listParams,
  salesDateFrom,
  salesDateTo,
  liveMode,
  loadFleetSnapshot,
  loadAlerts,
  loadPendingRequests,
}: UseTripOperationsQueriesArgs) {
  const tripsQuery = useQuery({
    queryKey: ['trips', 'operations', listParams, liveMode] as const,
    queryFn: () => listTrips(listParams),
    refetchInterval: liveMode ? 30_000 : false,
  })

  const salesQuery = useQuery({
    queryKey: ['sales', 'operations', salesDateFrom, salesDateTo, liveMode] as const,
    queryFn: () =>
      listSales({
        date_from: salesDateFrom.trim() || undefined,
        date_to: salesDateTo.trim() || undefined,
      }),
    refetchInterval: liveMode ? 30_000 : false,
  })

  const alertsQuery = useQuery({
    queryKey: ['inventory', 'alerts', 'operations'] as const,
    queryFn: () => getInventoryAlerts(),
    enabled: loadAlerts,
  })

  const pendingRequestsQuery = useQuery({
    queryKey: ['requests', 'fleet', 'pending', 'operations'] as const,
    queryFn: () => listFleetRequests({ status: 'pending' }),
    enabled: loadPendingRequests,
  })

  const fleetSnapshotQuery = useQuery({
    queryKey: ['inventory', 'fleet-snapshot', 'operations'] as const,
    queryFn: () => listInventory(),
    enabled: loadFleetSnapshot,
  })

  const productsQuery = useQuery({
    queryKey: ['products', 'operations-map'] as const,
    queryFn: () => listProducts({ per_page: 500, sort: 'id', direction: 'asc' }),
  })

  const productsById = useMemo(() => {
    const m = new Map<number, ProductResource>()
    for (const p of productsQuery.data?.items ?? []) {
      m.set(p.id, p)
    }
    return m
  }, [productsQuery.data])

  return {
    tripsQuery,
    salesQuery,
    alertsQuery,
    pendingRequestsQuery,
    fleetSnapshotQuery,
    productsById,
  }
}
