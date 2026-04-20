import { useEffect, useMemo, useState } from 'react'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { TripCard } from '@/features/trips/components/TripCard'
import { TripFiltersBar } from '@/features/trips/components/TripFiltersBar'
import { TripWorkspacePanel } from '@/features/trips/components/TripWorkspacePanel'
import { mockTrips, tripKpis, tripWorkspaceById } from '@/features/trips/mockTripData'
import type { WorkspaceTabId } from '@/features/trips/types'
import { cn } from '@/lib/utils'

function tripMatchesFilters(
  trip: (typeof mockTrips)[0],
  zone: string,
  driver: string,
  search: string,
) {
  if (zone !== 'Filter by Zone' && !trip.zone.toLowerCase().includes(zone.toLowerCase())) {
    return false
  }
  if (driver !== 'Filter by Driver' && trip.driverName !== driver) {
    return false
  }
  const q = search.trim().toLowerCase()
  if (!q) return true
  return (
    trip.displayId.toLowerCase().includes(q) ||
    trip.zone.toLowerCase().includes(q) ||
    trip.driverName.toLowerCase().includes(q) ||
    trip.vehicleLabel.toLowerCase().includes(q)
  )
}

export function TripManagementPage() {
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('1042')
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabId>('timeline')
  const [dateRangeLabel] = useState('Oct 1 - Oct 31, 2023')
  const [zone, setZone] = useState('Filter by Zone')
  const [driver, setDriver] = useState('Filter by Driver')
  const [search, setSearch] = useState('')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 400)
    return () => window.clearTimeout(id)
  }, [])

  const filteredTrips = useMemo(
    () => mockTrips.filter((t) => tripMatchesFilters(t, zone, driver, search)),
    [zone, driver, search],
  )

  useEffect(() => {
    if (filteredTrips.length === 0) {
      setSelectedId('')
      return
    }
    if (selectedId && !filteredTrips.some((t) => t.id === selectedId)) {
      setSelectedId(filteredTrips[0].id)
    }
  }, [filteredTrips, selectedId])

  const workspaceDetail = selectedId ? tripWorkspaceById[selectedId] ?? null : null

  function selectTrip(id: string) {
    setSelectedId(id)
    setWorkspaceTab('timeline')
    setMobilePanelOpen(true)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="min-h-[100px]" />
          ))}
        </div>
        <LoadingSkeleton className="min-h-[48px]" />
        <div className="grid gap-6 xl:grid-cols-2">
          <LoadingSkeleton className="min-h-[280px]" />
          <LoadingSkeleton className="min-h-[280px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-[1600px]">
      {/* Desktop + large tablet: split layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
        <div className="min-w-0 flex-1 space-y-8 lg:w-[65%] lg:max-w-none lg:pr-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div className="relative overflow-hidden rounded-xl bg-surface-lowest p-5 shadow-sm">
              <div
                className="absolute bottom-0 left-0 top-0 w-1 bg-primary"
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Trips
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-primary">
                  {tripKpis.activeTrips.value}
                </span>
                <span className="text-xs font-bold text-success">{tripKpis.activeTrips.delta}</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-surface-lowest p-5 shadow-sm">
              <div
                className="absolute bottom-0 left-0 top-0 w-1 bg-primary-container"
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Loading
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-primary">
                  {tripKpis.loadingTrucks.value}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {tripKpis.loadingTrucks.suffix}
                </span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-surface-lowest p-5 shadow-sm">
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sales Today
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-primary">
                  {tripKpis.salesToday.value}
                </span>
                <span className="text-xs font-bold text-success">↑</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-surface-lowest p-5 shadow-sm">
              <div
                className="absolute bottom-0 left-0 top-0 w-1 bg-primary-container"
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Revenue Today
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-primary">
                  {tripKpis.revenueToday.value}
                </span>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <TripFiltersBar
              dateRangeLabel={dateRangeLabel}
              zone={zone}
              onZoneChange={setZone}
              driver={driver}
              onDriverChange={setDriver}
              search={search}
              onSearchChange={setSearch}
            />
            {filteredTrips.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 bg-surface-lowest/80 px-4 py-12 text-center text-sm text-muted-foreground">
                No trips match the current filters or search.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    selected={selectedId === trip.id}
                    onSelect={() => selectTrip(trip.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Desktop workspace column */}
        <div className="hidden lg:block lg:w-[35%] lg:min-w-[320px]">
          <TripWorkspacePanel
            detail={workspaceDetail}
            activeTab={workspaceTab}
            onTabChange={setWorkspaceTab}
            onClose={() => setSelectedId('')}
            layout="desktop"
          />
        </div>
      </div>

      {/* Tablet / mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity lg:hidden',
          mobilePanelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!mobilePanelOpen}
        onClick={() => setMobilePanelOpen(false)}
      />

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-full transform border-l border-border/60 bg-background shadow-2xl transition-transform duration-200 ease-out sm:max-w-md lg:hidden',
          mobilePanelOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Trip workspace"
      >
        <TripWorkspacePanel
          detail={workspaceDetail}
          activeTab={workspaceTab}
          onTabChange={setWorkspaceTab}
          onClose={() => setMobilePanelOpen(false)}
          layout="drawer"
        />
      </div>
    </div>
  )
}
