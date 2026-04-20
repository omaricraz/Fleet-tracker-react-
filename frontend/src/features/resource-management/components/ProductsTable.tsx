import { Edit, MoreVertical, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { ProductRow } from '../types'

interface ProductsTableProps {
  rows: ProductRow[]
  onEdit: (row: ProductRow) => void
  onDelete: (row: ProductRow) => void
}

export function ProductsTable({ rows, onEdit, onDelete }: ProductsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-high/30">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Item Name
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Type
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Price
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Unit Weight
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Unit Volume
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
                <td className="px-6 py-5 text-sm text-muted-foreground">{row.type}</td>
                <td className="px-6 py-5 text-sm font-semibold text-foreground">{row.price}</td>
                <td className="px-6 py-5 text-sm text-muted-foreground">{row.unitWeight}</td>
                <td className="px-6 py-5 text-sm text-muted-foreground">{row.unitVolume}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-primary-container/10 hover:text-primary"
                      aria-label="Edit product"
                      onClick={() => onEdit(row)}
                    >
                      <Edit className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete product"
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

      <div className="space-y-4 p-4 lg:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <p className="font-bold text-foreground">{row.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{row.type}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-semibold">{row.price}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Weight</dt>
                <dd>{row.unitWeight}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Volume</dt>
                <dd>{row.unitVolume}</dd>
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
