import { useState, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type ResourceFormValues = Record<string, string | undefined>
export type ResourceFormField = {
  key: string
  label: string
  type?: 'text' | 'number' | 'email'
  required?: boolean
}

interface AddDriverModalProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  submitLabel: string
  fields: ResourceFormField[]
  initialValues: ResourceFormValues
  errors?: Record<string, string>
  submitting?: boolean
  onSubmit: (values: ResourceFormValues) => void
}

export function AddDriverModal({
  open,
  onClose,
  title,
  description,
  submitLabel,
  fields,
  initialValues,
  errors = {},
  submitting = false,
  onSubmit,
}: AddDriverModalProps) {
  const [values, setValues] = useState<ResourceFormValues>(initialValues)

  if (!open) {
    return null
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <form
        className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="resource-modal-title" className="text-lg font-black text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor={field.key}>
                {field.label}
              </label>
              <input
                id={field.key}
                type={field.type ?? 'text'}
                value={values[field.key] ?? ''}
                required={field.required}
                disabled={submitting}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              {errors[field.key] ? <p className="text-xs font-semibold text-destructive">{errors[field.key]}</p> : null}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
