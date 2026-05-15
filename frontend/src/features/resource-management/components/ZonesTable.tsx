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
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 [scrollbar-gutter:stable]">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="bg-surface-high/30">
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Zone Name
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              City
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Stores
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Status
            </th>
            <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
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
              <td className="px-4 py-5 text-sm font-bold text-foreground sm:px-6">{row.name}</td>
              <td className="px-4 py-5 text-sm text-muted-foreground sm:px-6">{row.city}</td>
              <td className="px-4 py-5 text-sm font-semibold text-foreground sm:px-6">{row.stores}</td>
              <td className="px-4 py-5">{zoneStatusPill(row.status)}</td>
              <td className="px-4 py-5 sm:px-6">
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
                  <Button type="button" variant="ghost" size="icon" className="rounded-lg hover:bg-surface-high" aria-label="More">
                    <MoreVertical className="size-5 text-muted-foreground" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
