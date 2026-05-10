import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'

export interface CreateVehicleValues {
  model: string
  plate_number: string
  color: string
  overall_volume_capacity: string
  overall_weight_capacity: string
}

interface CreateVehicleModalProps {
  open: boolean
  onClose: () => void
  submitting?: boolean
  onSubmit: (values: CreateVehicleValues) => void
}

const INITIAL_VALUES: CreateVehicleValues = {
  model: '',
  plate_number: '',
  color: '',
  overall_volume_capacity: '',
  overall_weight_capacity: '',
}

export function CreateVehicleModal({
  open,
  onClose,
  submitting = false,
  onSubmit,
}: CreateVehicleModalProps) {
  const [values, setValues] = useState<CreateVehicleValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      setValues(INITIAL_VALUES)
      setErrors({})
    }
  }, [open])

  if (!open) return null

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (values.model.trim().length === 0) {
      nextErrors.model = 'Model is required.'
    }
    if (values.plate_number.trim().length === 0) {
      nextErrors.plate_number = 'Plate number is required.'
    }
    if (values.overall_volume_capacity.trim().length > 0) {
      const volume = Number(values.overall_volume_capacity)
      if (!Number.isFinite(volume) || volume < 0) {
        nextErrors.overall_volume_capacity = 'Overall volume capacity must be 0 or greater.'
      }
    }
    if (values.overall_weight_capacity.trim().length > 0) {
      const weight = Number(values.overall_weight_capacity)
      if (!Number.isFinite(weight) || weight < 0) {
        nextErrors.overall_weight_capacity = 'Overall weight capacity must be 0 or greater.'
      }
    }

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
        aria-label="Close add vehicle dialog"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <form
        className="relative z-10 w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Add vehicle</h2>
            <p className="mt-1 text-sm text-muted-foreground">Creates a new car via /api/v1/cars.</p>
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

        <div className="mt-6 grid gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="vehicle-model">
              Model *
            </label>
            <input
              id="vehicle-model"
              disabled={submitting}
              value={values.model}
              maxLength={255}
              onChange={(e) => setValues((prev) => ({ ...prev, model: e.target.value }))}
              className={fieldClassName}
              placeholder="e.g. Toyota Dyna"
            />
            {errors.model ? <p className="text-xs font-semibold text-destructive">{errors.model}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="vehicle-plate">
              Plate Number *
            </label>
            <input
              id="vehicle-plate"
              disabled={submitting}
              value={values.plate_number}
              maxLength={255}
              onChange={(e) => setValues((prev) => ({ ...prev, plate_number: e.target.value }))}
              className={fieldClassName}
              placeholder="e.g. AB-1234"
            />
            {errors.plate_number ? (
              <p className="text-xs font-semibold text-destructive">{errors.plate_number}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="vehicle-color">
              Color
            </label>
            <input
              id="vehicle-color"
              disabled={submitting}
              value={values.color}
              maxLength={255}
              onChange={(e) => setValues((prev) => ({ ...prev, color: e.target.value }))}
              className={fieldClassName}
              placeholder="Optional"
            />
            {errors.overall_volume_capacity ? (
              <p className="text-xs font-semibold text-destructive">{errors.overall_volume_capacity}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
              htmlFor="vehicle-overall-volume-capacity"
            >
              Overall Volume Capacity
            </label>
            <input
              id="vehicle-overall-volume-capacity"
              type="number"
              step="any"
              min={0}
              disabled={submitting}
              value={values.overall_volume_capacity}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, overall_volume_capacity: e.target.value }))
              }
              className={fieldClassName}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
              htmlFor="vehicle-overall-weight-capacity"
            >
              Overall Weight Capacity
            </label>
            <input
              id="vehicle-overall-weight-capacity"
              type="number"
              step="any"
              min={0}
              disabled={submitting}
              value={values.overall_weight_capacity}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, overall_weight_capacity: e.target.value }))
              }
              className={fieldClassName}
              placeholder="Optional"
            />
            {errors.overall_weight_capacity ? (
              <p className="text-xs font-semibold text-destructive">{errors.overall_weight_capacity}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Create vehicle
          </Button>
        </div>
      </form>
    </div>
  )
}
