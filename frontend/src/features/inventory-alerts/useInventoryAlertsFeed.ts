import { useQuery } from '@tanstack/react-query'

import { INVENTORY_ALERTS_POLL_INTERVAL_MS } from '@/features/inventory-alerts/constants'
import { normalizeInventoryAlertsPayload } from '@/features/inventory-alerts/normalizeInventoryAlerts'
import { getInventoryAlerts } from '@/services/api/inventory'

export function useInventoryAlertsFeed(enabled: boolean) {
  return useQuery({
    queryKey: ['inventory', 'alerts', 'feed'] as const,
    queryFn: async () => {
      const raw = await getInventoryAlerts()
      return normalizeInventoryAlertsPayload(raw)
    },
    enabled,
    refetchInterval: INVENTORY_ALERTS_POLL_INTERVAL_MS,
    staleTime: Math.min(60_000, INVENTORY_ALERTS_POLL_INTERVAL_MS / 2),
    refetchOnMount: true,
  })
}
