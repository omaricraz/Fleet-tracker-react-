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
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-high/30">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Name
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Phone
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Zone
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Location
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Last Order
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
                <td className="px-6 py-5 text-sm font-medium text-muted-foreground">{row.phone}</td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {row.zone}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-muted-foreground">{row.location}</td>
                <td className="px-6 py-5 text-sm font-semibold text-foreground">{row.lastOrder}</td>
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
            <p className="font-bold text-foreground">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.phone}</p>
            <dl className="mt-4 space-y-2 text-sm">
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
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right">{row.location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Last order</dt>
                <dd className="font-semibold">{row.lastOrder}</dd>
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
