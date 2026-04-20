import { ChevronDown, MapPin, Package, Plus, Truck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AddVehicleMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        size="lg"
        className="h-auto gap-3 rounded-xl px-6 py-3 text-lg font-bold shadow-lg shadow-primary/20"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="size-5" />
        <span className="text-lg leading-none">Add</span>
        <ChevronDown className="size-4 opacity-70" />
      </Button>
      {open ? (
        <div
          className={cn(
            'absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-border/60 bg-card py-2 shadow-2xl',
          )}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Truck className="size-5 shrink-0" />
            Add Vehicle
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Package className="size-5 shrink-0" />
            Add Inventory
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <MapPin className="size-5 shrink-0" />
            Add Zone
          </button>
        </div>
      ) : null}
    </div>
  )
}
