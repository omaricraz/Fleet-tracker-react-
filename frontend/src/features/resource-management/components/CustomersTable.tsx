import { Edit, MoreVertical, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { CustomerRow } from '../types'

interface CustomersTableProps {
  rows: CustomerRow[]
  onEdit: (row: CustomerRow) => void
  onDelete: (row: CustomerRow) => void
}

export function CustomersTable({ rows, onEdit, onDelete }: CustomersTableProps) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 [scrollbar-gutter:stable]">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <thead>
          <tr className="bg-surface-high/30">
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Name
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Phone
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Zone
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Location
            </th>
            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:px-6">
              Last Order
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
              <td className="px-4 py-5 text-sm font-medium text-muted-foreground sm:px-6">{row.phone}</td>
              <td className="px-4 py-5 sm:px-6">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  {row.zone}
                </span>
              </td>
              <td className="px-4 py-5 text-sm text-muted-foreground sm:px-6">{row.location}</td>
              <td className="px-4 py-5 text-sm font-semibold text-foreground sm:px-6">{row.lastOrder}</td>
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
