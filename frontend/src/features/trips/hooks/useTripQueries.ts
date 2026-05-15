import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  closeTrip,
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  openTrip,
  type ListTripsQuery,
  type StoreTripBody,
} from '@/services/api/trips'

export function useTripsQuery(filters: ListTripsQuery = {}) {
  return useQuery({
    queryKey: ['trips', filters] as const,
    queryFn: () => listTrips(filters),
  })
}

export function useTripDetailQuery(tripId: string | null) {
  return useQuery({
    queryKey: ['trip', tripId] as const,
    queryFn: () => getTrip(tripId!),
    enabled: Boolean(tripId),
  })
}

export function useTripMutations() {
  const qc = useQueryClient()

  const invalidateTrips = () => {
    void qc.invalidateQueries({ queryKey: ['trips'] })
  }

  const open = useMutation({
    mutationFn: (tripId: number | string) => openTrip(tripId),
    onSuccess: (_data, tripId) => {
      invalidateTrips()
      void qc.invalidateQueries({ queryKey: ['trip', String(tripId)] })
    },
  })

  const close = useMutation({
    mutationFn: (tripId: number | string) => closeTrip(tripId),
    onSuccess: (_data, tripId) => {
      invalidateTrips()
      void qc.invalidateQueries({ queryKey: ['trip', String(tripId)] })
    },
  })

  const remove = useMutation({
    mutationFn: (tripId: number | string) => deleteTrip(tripId),
    onSuccess: (_data, tripId) => {
      invalidateTrips()
      void qc.invalidateQueries({ queryKey: ['trip', String(tripId)] })
    },
  })

  const create = useMutation({
    mutationFn: (body: StoreTripBody) => createTrip(body),
    onSuccess: () => {
      invalidateTrips()
    },
  })

  return { open, close, remove, create }
}
