import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import { listProducts } from '@/services/api/products'
import type { ProductResource } from '@/services/api/types'

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return d
}

export function useInventoryProductPicker() {
  const [rowFilters, setRowFilters] = useState<Record<string, string>>({})
  const [activeRowId, setActiveRowId] = useState<string | null>(null)

  const activeFilterRaw = activeRowId ? rowFilters[activeRowId] ?? '' : ''
  const debouncedSearch = useDebounced(activeFilterRaw.trim(), 320)

  const baseQuery = useQuery({
    queryKey: ['products', 'fleet-inventory-base'] as const,
    queryFn: () => listProducts({ per_page: 500, sort: 'item', direction: 'asc' }),
    staleTime: 60_000,
  })

  const searchQuery = useQuery({
    queryKey: ['products', 'fleet-inventory-search', debouncedSearch] as const,
    queryFn: () =>
      listProducts({
        search: debouncedSearch,
        per_page: 120,
        sort: 'item',
        direction: 'asc',
      }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  })

  const baseItems = baseQuery.data?.items ?? []

  const getProductsForRow = useCallback(
    (rowId: string): ProductResource[] => {
      const f = (rowFilters[rowId] ?? '').trim().toLowerCase()
      if (f.length >= 2 && rowId === activeRowId) {
        const searched = searchQuery.data?.items
        if (searched && searched.length > 0) return searched
      }
      if (!f) return baseItems
      return baseItems.filter((p) => p.item.toLowerCase().includes(f)).slice(0, 150)
    },
    [rowFilters, activeRowId, searchQuery.data?.items, baseItems],
  )

  const getProductsLoading = useCallback(
    (rowId: string) => {
      if (baseQuery.isLoading) return true
      const f = (rowFilters[rowId] ?? '').trim()
      if (f.length >= 2 && rowId === activeRowId) return searchQuery.isFetching
      return false
    },
    [activeRowId, baseQuery.isLoading, searchQuery.isFetching, rowFilters],
  )

  const getProductsError = useCallback(
    (rowId: string) => {
      if (baseQuery.isError) return true
      const f = (rowFilters[rowId] ?? '').trim()
      if (f.length >= 2 && rowId === activeRowId) return searchQuery.isError
      return false
    },
    [activeRowId, baseQuery.isError, rowFilters, searchQuery.isError],
  )

  const resetRowFilter = useCallback((rowId: string) => {
    setRowFilters((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
  }, [])

  return {
    rowFilters,
    setRowFilters,
    setActiveRowId,
    getProductsForRow,
    getProductsLoading,
    getProductsError,
    resetRowFilter,
    catalogLoading: baseQuery.isLoading,
    catalogError: baseQuery.isError,
  }
}
