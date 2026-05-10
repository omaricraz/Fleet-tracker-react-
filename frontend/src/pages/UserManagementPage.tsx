import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

import { FilterBar } from '@/components/FilterBar'
import { PageHeader } from '@/components/PageHeader'
import { useToast } from '@/components/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { PaginationBar } from '@/features/resource-management/components/PaginationBar'
import { ApiError } from '@/services/api/client'
import {
  createTenantUser,
  deleteTenantUser,
  listTenantUsers,
  updateTenantUser,
  type StoreTenantUserBody,
  type UpdateTenantUserBody,
} from '@/services/api/users'
import type { UserResource, UserRole } from '@/services/api/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10
const QUERY_KEY = 'tenant-users'

const SORT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'created_at', label: 'Created' },
] as const

function rolePill(role: UserRole) {
  const tone =
    role === 'admin'
      ? 'bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200'
      : role === 'manager'
        ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200'
        : 'bg-muted text-muted-foreground'
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
        tone,
      )}
    >
      {role}
    </span>
  )
}

function mapApiErrors(err: ApiError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, msgs] of Object.entries(err.errors)) {
    if (msgs?.[0]) out[k] = msgs[0]!
  }
  if (Object.keys(out).length === 0 && err.message) {
    out._form = err.message
  }
  return out
}

type UserFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  user: UserResource | null
  onClose: () => void
  submitting: boolean
  fieldErrors: Record<string, string>
  onClearFieldError: (key: string) => void
  onSubmit: (body: StoreTenantUserBody | UpdateTenantUserBody) => void
}

function UserFormModal({
  open,
  mode,
  user,
  onClose,
  submitting,
  fieldErrors,
  onClearFieldError,
  onSubmit,
}: UserFormModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('manager')

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setPassword('')
    setRole(user?.role ?? 'manager')
  }, [open, user, mode])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'create') {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      } satisfies StoreTenantUserBody)
      return
    }
    const patch: UpdateTenantUserBody = {
      name: name.trim(),
      email: email.trim(),
      role,
    }
    const trimmed = password.trim()
    if (trimmed) patch.password = trimmed
    onSubmit(patch)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <form
        className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-ambient)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="user-modal-title" className="text-lg font-black text-foreground">
              {mode === 'create' ? 'Add user' : 'Edit user'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Create a tenant account with role-based access.'
                : 'Update profile details. Leave password empty to keep the current value.'}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>

        {fieldErrors._form ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">
            {fieldErrors._form}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="user-name">
              Name
            </label>
            <input
              id="user-name"
              required
              disabled={submitting}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                onClearFieldError('name')
              }}
              className="w-full rounded-lg border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
            {fieldErrors.name ? <p className="text-xs font-semibold text-destructive">{fieldErrors.name}</p> : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              required
              disabled={submitting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                onClearFieldError('email')
              }}
              className="w-full rounded-lg border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
            {fieldErrors.email ? <p className="text-xs font-semibold text-destructive">{fieldErrors.email}</p> : null}
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor="user-password"
            >
              Password {mode === 'edit' ? '(optional)' : null}
            </label>
            <input
              id="user-password"
              type="password"
              autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
              required={mode === 'create'}
              disabled={submitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                onClearFieldError('password')
              }}
              placeholder={mode === 'edit' ? 'Leave blank to keep current' : undefined}
              className="w-full rounded-lg border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
            {fieldErrors.password ? (
              <p className="text-xs font-semibold text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              disabled={submitting}
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole)
                onClearFieldError('role')
              }}
              className="w-full rounded-lg border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="driver">Driver</option>
            </select>
            {fieldErrors.role ? <p className="text-xs font-semibold text-destructive">{fieldErrors.role}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {mode === 'create' ? 'Create user' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function UserManagementPage() {
  const { user: authUser } = useAuth()
  const { pushToast } = useToast()
  const qc = useQueryClient()

  const canAccess =
    authUser &&
    !authUser.is_platform_admin &&
    (authUser.role === 'admin' || authUser.role === 'manager')
  const canMutate = authUser?.role === 'admin'

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>('name')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<UserResource | null>(null)
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sort, direction])

  const listQuery = useQuery({
    queryKey: [QUERY_KEY, page, debouncedSearch, sort, direction],
    queryFn: () =>
      listTenantUsers({
        page,
        per_page: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sort,
        direction,
      }),
    enabled: !!canAccess,
  })

  const items = listQuery.data?.items ?? []
  const meta = listQuery.data?.meta
  const total = meta?.total ?? 0

  const createMutation = useMutation({
    mutationFn: (body: StoreTenantUserBody) => createTenantUser(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      pushToast('success', 'User created.')
      closeModal()
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) setModalErrors(mapApiErrors(e))
      else pushToast('error', 'Could not create user.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTenantUserBody }) => updateTenantUser(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      pushToast('success', 'User updated.')
      closeModal()
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) setModalErrors(mapApiErrors(e))
      else pushToast('error', 'Could not update user.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTenantUser(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      pushToast('success', 'User removed.')
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'Could not delete user.'
      pushToast('error', msg)
    },
  })

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingUser(null)
    setModalErrors({})
  }, [])

  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditingUser(null)
    setModalErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((u: UserResource) => {
    setModalMode('edit')
    setEditingUser(u)
    setModalErrors({})
    setModalOpen(true)
  }, [])

  const handleModalSubmit = useCallback(
    (body: StoreTenantUserBody | UpdateTenantUserBody) => {
      setModalErrors({})
      if (modalMode === 'create') {
        createMutation.mutate(body as StoreTenantUserBody)
        return
      }
      if (!editingUser) return
      updateMutation.mutate({ id: editingUser.id, body: body as UpdateTenantUserBody })
    },
    [modalMode, editingUser, createMutation, updateMutation],
  )

  const submitting = createMutation.isPending || updateMutation.isPending

  const sortSelect = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="user-sort">
          Sort by
        </label>
        <select
          id="user-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border/60 bg-surface-lowest px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          {SORT_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={() => setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
        >
          {direction === 'asc' ? 'Ascending' : 'Descending'}
        </Button>
      </div>
    ),
    [sort, direction],
  )

  if (!authUser) {
    return null
  }

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="List and maintain tenant user accounts. Managers can view directory data; only admins can create, edit, or remove users (see API roles)."
        actions={
          canMutate ? (
            <Button type="button" className="gap-2 shadow-sm" onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Add user
            </Button>
          ) : null
        }
      />

      {listQuery.error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-destructive">
            {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load users.'}
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={() => void listQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <FilterBar
        searchPlaceholder="Search name, email, or role"
        searchValue={searchInput}
        onSearchChange={(e) => setSearchInput(e.target.value)}
        searchAriaLabel="Search users"
        searchDisabled={!!listQuery.error}
        filters={sortSelect}
      />

      <section className="surface-panel overflow-hidden rounded-xl border border-border/60">
        <div className="border-b border-border/60 bg-surface-high/20 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-black tracking-tight text-primary">Tenant users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-high/30">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin opacity-60" aria-hidden />
                    <span className="sr-only">Loading users</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const isSelf = authUser.id === row.id
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-primary-fixed/35 dark:hover:bg-primary-fixed/15">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">{row.name}</span>
                          {isSelf ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">You</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.email}</td>
                      <td className="px-6 py-4">{rolePill(row.role)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          {canMutate ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-9 rounded-lg"
                                aria-label={`Edit ${row.name}`}
                                onClick={() => openEdit(row)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-9 rounded-lg text-destructive hover:text-destructive"
                                disabled={deleteMutation.isPending || isSelf}
                                aria-label={isSelf ? 'Cannot delete your own account' : `Delete ${row.name}`}
                                title={isSelf ? 'You cannot delete your own account' : undefined}
                                onClick={() => {
                                  if (isSelf) return
                                  if (!window.confirm(`Remove user ${row.name}? This cannot be undone.`)) return
                                  deleteMutation.mutate(row.id)
                                }}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">View only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          entityLabel="users"
          onPageChange={setPage}
        />
      </section>

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        user={editingUser}
        onClose={closeModal}
        submitting={submitting}
        fieldErrors={modalErrors}
        onClearFieldError={(key) => setModalErrors((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}
