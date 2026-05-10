import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { TripTimelineTab } from '@/features/trips/components/TripTimelineTab'
import { mapTimeline } from '@/features/trips/lib/mapTrip'
import { ApiError } from '@/services/api/client'
import { listDrivers } from '@/services/api/drivers'
import { closeTrip, listTrips } from '@/services/api/trips'
import type { TripTimelineEvent } from '@/services/api/types'
import { useToast } from '@/components/providers/toast-provider'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

export function DriverTripPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const qc = useQueryClient()

  const { data: driverId } = useQuery({
    queryKey: ['driver-scope', user?.name],
    queryFn: async () => {
      if (!user?.name) return null
      const { items } = await listDrivers({ per_page: 100, search: user.name })
      const match = items.find((d) => d.full_name.trim() === user.name.trim())
      return match?.id ?? null
    },
    enabled: Boolean(user?.name),
  })

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', 'driver-active', driverId],
    queryFn: () => listTrips({ status: 'active', driver_id: driverId ?? undefined }),
    enabled: driverId != null,
  })

  const activeTrip = trips[0] ?? null
  const tripId = activeTrip && typeof activeTrip.id === 'number' ? activeTrip.id : null

  const closeMut = useMutation({
    mutationFn: () => closeTrip(tripId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips'] })
      pushToast('success', 'Trip closed.')
    },
    onError: (e) => {
      pushToast('error', e instanceof ApiError ? e.message : 'Could not close trip.')
    },
  })

  const timelineRaw = (activeTrip as unknown as { timeline?: TripTimelineEvent[] }).timeline
  const timeline = Array.isArray(timelineRaw) ? mapTimeline(timelineRaw) : []

  const displayTripNumber = activeTrip ? `Trip #${String(activeTrip.id)}` : 'No active trip'
  const destination =
    activeTrip && typeof activeTrip.destination === 'string' ? activeTrip.destination : '—'
  const car =
    activeTrip?.car && typeof activeTrip.car === 'object' && 'model' in activeTrip.car
      ? (activeTrip.car as { model: string; plate_number: string })
      : null

  return (
    <>
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[rgb(248_249_255/0.85)] px-6 py-3 shadow-sm backdrop-blur-xl dark:bg-[rgb(0_23_47/0.85)]">
        <div className="flex items-center gap-4">
          <Link
            to="/platform"
            className="material-symbols-outlined rounded-full p-2 text-primary transition-transform duration-200 hover:bg-surface-high active:scale-95 dark:text-primary-fixed-dim"
            aria-label="Open home"
          >
            menu
          </Link>
          <h1 className="text-xl font-black tracking-tight text-primary-container dark:text-white">
            My Trip
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="material-symbols-outlined rounded-full p-2 text-primary transition-all hover:bg-surface-high active:scale-95 dark:text-primary-fixed-dim"
            aria-label="Refresh"
            onClick={() => void qc.invalidateQueries({ queryKey: ['trips'] })}
          >
            refresh
          </button>
          <Link
            to="/dashboard"
            className="size-10 overflow-hidden rounded-full border-2 border-primary-fixed"
            aria-label="Account"
          >
            <img
              alt=""
              className="size-full object-cover"
              decoding="async"
              src={DRIVER_AVATAR}
              width={40}
              height={40}
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pb-36 pt-20">
        {isLoading || driverId == null ? (
          <LoadingSkeleton className="min-h-[200px]" />
        ) : !activeTrip ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-12 text-center text-sm text-muted-foreground">
            You do not have an active trip. Create one from trip management after your admin opens a
            route.
          </p>
        ) : (
          <>
            <section className="hero-gradient relative overflow-hidden rounded-xl p-6 text-primary-foreground shadow-lg">
              <div className="absolute right-4 top-4 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                Active
              </div>
              <div className="mb-6 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary-fixed-dim">
                  Current Trip
                </p>
                <h2 className="text-3xl font-black tracking-tighter">{displayTripNumber}</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4">
                <Stat label="Destination" value={destination} />
                <Stat label="Vehicle" value={car?.model ?? '—'} />
                <Stat label="Plate Number" value={car?.plate_number ?? '—'} />
                <Stat label="Trip id" value={String(activeTrip.id)} />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <button
                type="button"
                disabled={closeMut.isPending || tripId == null}
                className="hero-gradient flex items-center justify-center gap-3 rounded-xl py-4 pl-6 pr-6 text-base font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
                onClick={() => {
                  if (!tripId) return
                  if (!window.confirm('Close this trip? You must submit a closing inventory count first.')) {
                    return
                  }
                  closeMut.mutate()
                }}
              >
                <span className="material-symbols-outlined">stop_circle</span>
                END TRIP
              </button>
            </section>

            <TripTimelineTab
              entries={timeline.length > 0 ? timeline : [{ id: '1', time: '—', title: 'Timeline', subtitle: 'Events appear as your trip progresses.', variant: 'transit' }]}
              heading="Trip Timeline"
            />
          </>
        )}
      </main>
    </>
  )
}

function Stat({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[10px] font-semibold uppercase text-primary-fixed-dim/90">{label}</p>
      <p className="text-base font-bold leading-tight">{value}</p>
    </div>
  )
}
