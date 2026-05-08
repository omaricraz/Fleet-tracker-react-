import { Link } from 'react-router-dom'

import { TripTimelineTab } from '@/features/trips/components/TripTimelineTab'
import { tripWorkspaceById } from '@/features/trips/mockTripData'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

const activeTrip = tripWorkspaceById['1042']

/** Demo stats aligned with design doc `driver_trip update` until wired to APIs. */
const driverTripStats = {
  destination: 'Hargeisa East',
  vehicle: 'Toyota Dyna',
  plate: 'SL2345',
  duration: '2h 45m',
  salesMade: '$420',
  stopsDone: 4,
  tripHours: '2.5h',
  fuelLeft: '65L',
  startedAt: '08:00 AM',
}

export function DriverTripPage() {
  const displayTripNumber = activeTrip.displayId.replace(/^Trip\s*#?/i, '#')

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
            onClick={() => window.location.reload()}
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
            <Stat label="Destination" value={driverTripStats.destination} />
            <Stat label="Vehicle" value={driverTripStats.vehicle} />
            <Stat label="Plate Number" value={driverTripStats.plate} />
            <Stat label="Duration" value={driverTripStats.duration} />
            <Stat label="Sales Made" value={driverTripStats.salesMade} className="border-t border-white/5 pt-2" />
            <Stat label="Stops Done" value={String(driverTripStats.stopsDone)} className="border-t border-white/5 pt-2" />
            <Stat label="Trip Time" value={driverTripStats.tripHours} className="border-t border-white/5 pt-2" />
            <Stat label="Fuel Left" value={driverTripStats.fuelLeft} className="border-t border-white/5 pt-2" />
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
            <span className="material-symbols-outlined text-primary-fixed-dim">schedule</span>
            <span className="text-sm font-medium">Started at {driverTripStats.startedAt}</span>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <button
            type="button"
            className="hero-gradient flex items-center justify-center gap-3 rounded-xl py-4 pl-6 pr-6 text-base font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">stop_circle</span>
            END TRIP
          </button>
        </section>

        <TripTimelineTab entries={activeTrip.timeline} heading="Trip Timeline" />
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
