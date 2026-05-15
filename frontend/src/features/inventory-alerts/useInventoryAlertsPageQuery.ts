import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { INVENTORY_ALERTS_POLL_INTERVAL_MS } from '@/features/inventory-alerts/constants'
import { normalizePaginatedInventoryAlertsResponse } from '@/features/inventory-alerts/normalizeInventoryAlerts'
import { getInventoryAlerts } from '@/services/api/inventory'

export function useInventoryAlertsPageQuery(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: ['inventory', 'alerts', page, pageSize] as const,
    queryFn: async () => {
      const raw = await getInventoryAlerts({ page, per_page: pageSize })
      return normalizePaginatedInventoryAlertsResponse(raw, { page, per_page: pageSize })
    },
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: INVENTORY_ALERTS_POLL_INTERVAL_MS,
    staleTime: Math.min(60_000, INVENTORY_ALERTS_POLL_INTERVAL_MS / 2),
    refetchOnMount: true,
  })
}
