import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/AuthContext'
import {
  approveRequestApi,
  deriveRequestMetrics,
  deriveRequestPage,
  fetchRequestSourceRows,
  listRequestFilterDrivers,
  rejectRequestApi,
  type RequestApiRole,
} from '../api/requestApi'
import type {
  DateRangePreset,
  FleetRequest,
  PaginatedResult,
  RequestListQuery,
  RequestMetrics,
  RequestStatus,
  RequestType,
} from '../types'

const DEFAULT_PAGE_SIZE = 8

const initialQuery: RequestListQuery = {
  search: '',
  type: 'all',
  status: 'all',
  driverId: 'all',
  datePreset: 'last_30',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

export function useRequestManagement() {
  const { user } = useAuth()
  const role: RequestApiRole | null =
    user?.role === 'admin' || user?.role === 'manager' || user?.role === 'driver' ? user.role : null

  const [query, setQuery] = useState<RequestListQuery>(initialQuery)
  const [sourceRows, setSourceRows] = useState<FleetRequest[] | null>(null)
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decisionSubmitting, setDecisionSubmitting] = useState(false)

  const metricsInput = useMemo(
    () => ({
      search: query.search,
      type: query.type,
      driverId: query.driverId,
      datePreset: query.datePreset,
    }),
    [query.search, query.type, query.driverId, query.datePreset],
  )

  const refreshSource = useCallback(async () => {
    if (!role) {
      setSourceRows(null)
      setLoading(false)
      setError('Sign in as a tenant user to load requests.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchRequestSourceRows(role, {
        type: query.type,
        driverId: query.driverId,
      })
      setSourceRows(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load requests.')
      setSourceRows(null)
    } finally {
      setLoading(false)
    }
  }, [role, query.type, query.driverId])

  useEffect(() => {
    void refreshSource()
  }, [refreshSource])

  const metrics = useMemo<RequestMetrics | null>(() => {
    if (!sourceRows) return null
    return deriveRequestMetrics(sourceRows, metricsInput)
  }, [sourceRows, metricsInput])

  const pageData = useMemo<PaginatedResult<FleetRequest> | null>(() => {
    if (!sourceRows) return null
    return deriveRequestPage(sourceRows, query)
  }, [sourceRows, query])

  useEffect(() => {
    if (!pageData) return
    const maxPage = Math.max(1, Math.ceil(pageData.total / query.pageSize))
    if (query.page > maxPage) {
      setQuery((q) => ({ ...q, page: maxPage }))
    }
  }, [pageData, query.page, query.pageSize])

  useEffect(() => {
    let cancelled = false
    if (!role || role === 'driver') {
      setDrivers([])
      return () => {
        cancelled = true
      }
    }
    void listRequestFilterDrivers()
      .then((d) => {
        if (!cancelled) setDrivers(d)
      })
      .catch(() => {
        if (!cancelled) setDrivers([])
      })
    return () => {
      cancelled = true
    }
  }, [role])

  function setSearch(search: string) {
    setQuery((q) => ({ ...q, search, page: 1 }))
  }

  function setTypeFilter(type: RequestType | 'all') {
    setQuery((q) => ({ ...q, type, page: 1 }))
  }

  function setStatusFilter(status: RequestStatus | 'all') {
    setQuery((q) => ({ ...q, status, page: 1 }))
  }

  function setDriverFilter(driverId: string | 'all') {
    setQuery((q) => ({ ...q, driverId, page: 1 }))
  }

  function setDatePreset(datePreset: DateRangePreset) {
    setQuery((q) => ({ ...q, datePreset, page: 1 }))
  }

  function setPage(page: number) {
    setQuery((q) => ({ ...q, page }))
  }

  function setPageSize(pageSize: number) {
    setQuery((q) => ({ ...q, pageSize, page: 1 }))
  }

  async function approveRequest(requestId: string) {
    setDecisionSubmitting(true)
    try {
      await approveRequestApi(requestId)
      await refreshSource()
    } finally {
      setDecisionSubmitting(false)
    }
  }

  async function rejectRequest(requestId: string, reason: string) {
    setDecisionSubmitting(true)
    try {
      await rejectRequestApi(requestId, reason)
      await refreshSource()
    } finally {
      setDecisionSubmitting(false)
    }
  }

  return {
    query,
    metrics,
    pageData,
    drivers,
    loading,
    error,
    decisionSubmitting,
    refresh: refreshSource,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setDriverFilter,
    setDatePreset,
    setPage,
    setPageSize,
    approveRequest,
    rejectRequest,
    requestRole: role,
  }
}
