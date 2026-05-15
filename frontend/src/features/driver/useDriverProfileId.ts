import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthContext'
import { listDrivers } from '@/services/api/drivers'

/** Resolves the drivers table id using `me.driver_id`, then falls back to name match. */
export function useDriverProfileId() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['driver-profile-id', user?.id, user?.driver_id, user?.name, user?.role],
    queryFn: async () => {
      if (!user) return null
      const direct = user.driver_id
      if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) return direct

      if (user.role === 'driver' && user.name?.trim()) {
        const search = user.name.trim()
        const { items } = await listDrivers({ per_page: 100, search })
        const match = items.find((d) => d.full_name.trim() === search)
        return match?.id ?? null
      }

      return null
    },
    enabled: Boolean(user),
  })
}
