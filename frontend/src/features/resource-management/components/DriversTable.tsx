import { Edit, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { DriverRow } from '../types'

function initialsFromName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase() || '?'
}

function statusPill(status: DriverRow['status']) {
  if (status === 'Available') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        Available
      </span>
    )
  }
  if (status === 'On Trip') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
        On Trip
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      Off Duty
    </span>
  )
}

interface DriversTableProps {
  rows: DriverRow[]
  onEdit: (row: DriverRow) => void
  onDelete: (row: DriverRow) => void
}

export function DriversTable({ rows, onEdit, onDelete }: DriversTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-high/30">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Full Name
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Contact
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Assigned Zone
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Vehicle
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full text-sm font-bold',
                        index % 3 === 1
                          ? 'bg-primary-fixed text-accent-foreground'
                          : 'bg-primary-container/90 text-primary-foreground',
                      )}
                    >
                      {initialsFromName(row.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground">ID: {row.driverId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                  {row.phone}
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {row.zone}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{row.vehicleModel}</p>
                    <p className="text-[10px] font-bold text-secondary opacity-80">{row.plate}</p>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">{statusPill(row.status)}</td>
                <td className="px-6 py-5">
                  <div className="relative flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-foreground hover:bg-primary-container/10 hover:text-primary"
                      aria-label={`Edit ${row.fullName}`}
                      onClick={() => onEdit(row)}
                    >
                      <Edit className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${row.fullName}`}
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-surface-high"
                      aria-label={`More actions for ${row.fullName}`}
                      onClick={() => setOpenMenuId((id) => (id === row.id ? null : row.id))}
                    >
                      <MoreVertical className="size-5 text-muted-foreground" />
                    </Button>
                    {openMenuId === row.id ? (
                      <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-border/60 bg-card py-1 shadow-lg">
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            onEdit(row)
                            setOpenMenuId(null)
                          }}
                        >
                          Assign vehicle
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setOpenMenuId(null)
                          }}
                        >
                          View history
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {rows.map((row, index) => (
          <article
            key={row.id}
            className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full text-sm font-bold',
                    index % 3 === 1
                      ? 'bg-primary-fixed text-accent-foreground'
                      : 'bg-primary-container/90 text-primary-foreground',
                  )}
                >
                  {initialsFromName(row.fullName)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{row.fullName}</p>
                  <p className="text-xs text-muted-foreground">ID: {row.driverId}</p>
                </div>
              </div>
              {statusPill(row.status)}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="font-medium text-foreground">{row.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Zone</dt>
                <dd>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {row.zone}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="text-right">
                  <span className="font-semibold">{row.vehicleModel}</span>
                  <span className="ml-2 text-xs font-bold text-secondary">{row.plate}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end gap-1 border-t border-border/60 pt-3">
              <Button type="button" variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(row)}>
                <Edit className="size-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() => onDelete(row)}
              >
                <Trash2 className="size-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="More">
                <MoreVertical className="size-5" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
