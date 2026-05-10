import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

import { RequestActionToast, type RequestToastState } from './components/RequestActionToast'
import { RequestDecisionModal } from './components/RequestDecisionModal'
import { RequestDetailModal } from './components/RequestDetailModal'
import { RequestFiltersBar } from './components/RequestFiltersBar'
import { RequestSummaryCards } from './components/RequestSummaryCards'
import { RequestTable } from './components/RequestTable'
import { useRequestManagement } from './hooks/useRequestManagement'
import type { FleetRequest, RequestDecisionAction } from './types'

export function RequestManagementPage() {
  const {
    query,
    metrics,
    pageData,
    drivers,
    loading,
    error,
    decisionSubmitting,
    refresh,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setDriverFilter,
    setDatePreset,
    setPage,
    approveRequest,
    rejectRequest,
    requestRole,
  } = useRequestManagement()

  const allowDecisions = requestRole === 'admin' || requestRole === 'manager'

  const [detailOpen, setDetailOpen] = useState(false)
  const [activeRequest, setActiveRequest] = useState<FleetRequest | null>(null)
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [decisionAction, setDecisionAction] = useState<RequestDecisionAction | null>(null)
  const [decisionTarget, setDecisionTarget] = useState<FleetRequest | null>(null)
  const [toast, setToast] = useState<RequestToastState | null>(null)

  const dismissToast = useCallback(() => setToast(null), [])

  function openDetail(request: FleetRequest) {
    setActiveRequest(request)
    setDetailOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
    setActiveRequest(null)
  }

  function openDecision(action: RequestDecisionAction, request: FleetRequest) {
    setDecisionAction(action)
    setDecisionTarget(request)
    setDecisionOpen(true)
  }

  function closeDecision() {
    if (!decisionSubmitting) {
      setDecisionOpen(false)
      setDecisionAction(null)
      setDecisionTarget(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Request management"
        description="Review fuel and maintenance requests from drivers. Filter the queue, inspect supporting documents, and move work forward with explicit approvals."
        actions={
          requestRole === 'driver' ? (
            <Link to="/driver">
              <Button type="button" variant="outline" className="shadow-sm gap-2">
                <Plus className="size-4" aria-hidden />
                New request
              </Button>
            </Link>
          ) : null
        }
      />

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      ) : null}

      <RequestSummaryCards metrics={metrics} loading={loading} />

      <section className="space-y-4">
        <RequestFiltersBar
          search={query.search}
          onSearchChange={setSearch}
          type={query.type}
          onTypeChange={setTypeFilter}
          status={query.status}
          onStatusChange={setStatusFilter}
          driverId={query.driverId}
          onDriverChange={setDriverFilter}
          drivers={drivers}
          datePreset={query.datePreset}
          onDatePresetChange={setDatePreset}
          disabled={!!error}
        />

        <div className="surface-panel rounded-xl border border-border/60 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black tracking-tight text-primary">All requests</h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Pending items stay highlighted across devices for faster triage.
            </p>
          </div>
          <RequestTable
            items={pageData?.items ?? []}
            loading={loading}
            page={query.page}
            pageSize={query.pageSize}
            total={pageData?.total ?? 0}
            onPageChange={setPage}
            onView={openDetail}
            onApprove={(r) => openDecision('approve', r)}
            onReject={(r) => openDecision('reject', r)}
            decisionDisabled={decisionSubmitting}
            allowDecisions={allowDecisions}
          />
        </div>
      </section>

      <RequestDetailModal
        key={detailOpen && activeRequest ? activeRequest.id : 'closed'}
        open={detailOpen}
        request={activeRequest}
        onClose={closeDetail}
        decisionDisabled={decisionSubmitting}
        allowDecisions={allowDecisions}
        onApprove={(r) => openDecision('approve', r)}
        onReject={(r) => openDecision('reject', r)}
      />

      <RequestDecisionModal
        key={
          decisionOpen && decisionTarget && decisionAction
            ? `${decisionTarget.id}-${decisionAction}`
            : 'closed'
        }
        open={decisionOpen}
        action={decisionAction}
        request={decisionTarget}
        loading={decisionSubmitting}
        onClose={closeDecision}
        onConfirm={async (input) => {
          const target = decisionTarget
          if (!target) return
          try {
            if (input.action === 'approve') {
              await approveRequest(target.id)
              setToast({ variant: 'success', message: `Request ${target.display_id} approved.` })
            } else {
              await rejectRequest(target.id, input.reason ?? '')
              setToast({ variant: 'success', message: `Request ${target.display_id} rejected.` })
            }
            closeDecision()
            closeDetail()
          } catch (e) {
            setToast({
              variant: 'error',
              message: e instanceof Error ? e.message : 'Decision could not be saved.',
            })
          }
        }}
      />

      <RequestActionToast toast={toast} onDismiss={dismissToast} />
    </div>
  )
}
