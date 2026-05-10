import { Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'

type Option = { id: number; label: string }

export interface CreateTripValues {
  driver_id: string
  car_id: string
  zone_id: string
  destination: string
  arrival_time: string
  departure: string
}

interface CreateTripModalProps {
  open: boolean
  onClose: () => void
  submitting?: boolean
  driverOptions: Option[]
  carOptions: Option[]
  zoneOptions: Option[]
  onSubmit: (values: CreateTripValues) => void
}

const INITIAL_VALUES: CreateTripValues = {
  driver_id: '',
  car_id: '',
  zone_id: '',
  destination: '',
  arrival_time: '',
  departure: '',
}

const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

function parseOptionalId(
  value: string,
  fieldLabel: string,
  availableIds: Set<number>,
): { parsed: number | null; error?: string } {
  const raw = value.trim()
  if (!raw) return { parsed: null }
  if (!/^\d+$/.test(raw)) return { parsed: null, error: `${fieldLabel} must be an integer.` }
  const parsed = Number(raw)
  if (!Number.isInteger(parsed)) return { parsed: null, error: `${fieldLabel} must be an integer.` }
  if (!availableIds.has(parsed)) return { parsed: null, error: `${fieldLabel} does not exist.` }
  return { parsed }
}

function validate(values: CreateTripValues, ids: { drivers: Set<number>; cars: Set<number>; zones: Set<number> }) {
  const errors: Record<string, string> = {}

  const driver = parseOptionalId(values.driver_id, 'Driver', ids.drivers)
  if (driver.error) errors.driver_id = driver.error
  if (driver.parsed == null) errors.driver_id = errors.driver_id ?? 'Driver is required.'

  const car = parseOptionalId(values.car_id, 'Car', ids.cars)
  if (car.error) errors.car_id = car.error
  if (car.parsed == null) errors.car_id = errors.car_id ?? 'Car is required.'

  const zone = parseOptionalId(values.zone_id, 'Zone', ids.zones)
  if (zone.error) errors.zone_id = zone.error

  const destination = values.destination.trim()
  if (destination.length > 500) {
    errors.destination = 'Destination must be at most 500 characters.'
  }

  const arrival = values.arrival_time.trim()
  if (arrival.length > 0 && !TIME_24H_REGEX.test(arrival)) {
    errors.arrival_time = 'Arrival time must use HH:mm format.'
  }

  const departure = values.departure.trim()
  if (departure.length > 0 && !TIME_24H_REGEX.test(departure)) {
    errors.departure = 'Departure must use HH:mm format.'
  }

  return errors
}

export function CreateTripModal({
  open,
  onClose,
  submitting = false,
  driverOptions,
  carOptions,
  zoneOptions,
  onSubmit,
}: CreateTripModalProps) {
  const [values, setValues] = useState<CreateTripValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const optionIds = useMemo(
    () => ({
      drivers: new Set(driverOptions.map((o) => o.id)),
      cars: new Set(carOptions.map((o) => o.id)),
      zones: new Set(zoneOptions.map((o) => o.id)),
    }),
    [driverOptions, carOptions, zoneOptions],
  )

  useEffect(() => {
    if (!open) {
      setValues(INITIAL_VALUES)
      setErrors({})
    }
  }, [open])

  if (!open) return null

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values, optionIds)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSubmit(values)
  }

  const fieldClassName =
    'w-full rounded-md border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60'
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close create trip dialog"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <form
        className="relative z-10 w-full max-w-xl rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Create trip</h2>
            <p className="mt-1 text-sm text-muted-foreground">Trips are saved to /api/v1/trips.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="trip-driver">
              Driver *
            </label>
            <select
              id="trip-driver"
              disabled={submitting}
              value={values.driver_id}
              onChange={(e) => setValues((prev) => ({ ...prev, driver_id: e.target.value }))}
              className={fieldClassName}
            >
              <option value="">Select driver</option>
              {driverOptions.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.label}
                </option>
              ))}
            </select>
            {errors.driver_id ? <p className="text-xs font-semibold text-destructive">{errors.driver_id}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="trip-car">
              Car *
            </label>
            <select
              id="trip-car"
              disabled={submitting}
              value={values.car_id}
              onChange={(e) => setValues((prev) => ({ ...prev, car_id: e.target.value }))}
              className={fieldClassName}
            >
              <option value="">Select car</option>
              {carOptions.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.label}
                </option>
              ))}
            </select>
            {errors.car_id ? <p className="text-xs font-semibold text-destructive">{errors.car_id}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="trip-zone">
              Zone
            </label>
            <select
              id="trip-zone"
              disabled={submitting}
              value={values.zone_id}
              onChange={(e) => setValues((prev) => ({ ...prev, zone_id: e.target.value }))}
              className={fieldClassName}
            >
              <option value="">No zone</option>
              {zoneOptions.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>
            {errors.zone_id ? <p className="text-xs font-semibold text-destructive">{errors.zone_id}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
              htmlFor="trip-destination"
            >
              Destination
            </label>
            <input
              id="trip-destination"
              disabled={submitting}
              value={values.destination}
              maxLength={500}
              onChange={(e) => setValues((prev) => ({ ...prev, destination: e.target.value }))}
              className={fieldClassName}
              placeholder="Optional destination"
            />
            {errors.destination ? (
              <p className="text-xs font-semibold text-destructive">{errors.destination}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="trip-arrival">
              Arrival time
            </label>
            <input
              id="trip-arrival"
              type="time"
              disabled={submitting}
              value={values.arrival_time}
              onChange={(e) => setValues((prev) => ({ ...prev, arrival_time: e.target.value }))}
              className={fieldClassName}
            />
            {errors.arrival_time ? (
              <p className="text-xs font-semibold text-destructive">{errors.arrival_time}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
              htmlFor="trip-departure"
            >
              Departure
            </label>
            <input
              id="trip-departure"
              type="time"
              disabled={submitting}
              value={values.departure}
              onChange={(e) => setValues((prev) => ({ ...prev, departure: e.target.value }))}
              className={fieldClassName}
            />
            {errors.departure ? (
              <p className="text-xs font-semibold text-destructive">{errors.departure}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Create trip
          </Button>
        </div>
      </form>
    </div>
  )
}
