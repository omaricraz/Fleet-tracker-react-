import { Edit, MoreVertical, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ZoneRow } from '../types'

function zoneStatusPill(status: ZoneRow['status']) {
  const active = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
        active
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  )
}

interface ZonesTableProps {
  rows: ZoneRow[]
  onEdit: (row: ZoneRow) => void
  onDelete: (row: ZoneRow) => void
}

export function ZonesTable({ rows, onEdit, onDelete }: ZonesTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-high/30">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Zone Name
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                City
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Stores
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Assigned Drivers
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15"
              >
                <td className="px-6 py-5 text-sm font-bold text-foreground">{row.name}</td>
                <td className="px-6 py-5 text-sm text-muted-foreground">{row.city}</td>
                <td className="px-6 py-5 text-sm font-semibold text-foreground">{row.stores}</td>
                <td className="px-6 py-5 text-sm font-semibold text-foreground">
                  {row.assignedDrivers}
                </td>
                <td className="px-6 py-5">{zoneStatusPill(row.status)}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-primary-container/10 hover:text-primary"
                      onClick={() => onEdit(row)}
                    >
                      <Edit className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="rounded-lg hover:bg-surface-high">
                      <MoreVertical className="size-5 text-muted-foreground" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-foreground">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.city}</p>
              </div>
              {zoneStatusPill(row.status)}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Stores</dt>
                <dd className="font-semibold">{row.stores}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Drivers</dt>
                <dd className="font-semibold">{row.assignedDrivers}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end gap-1 border-t border-border/60 pt-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(row)}>
                <Edit className="size-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(row)}>
                <Trash2 className="size-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon">
                <MoreVertical className="size-5" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
