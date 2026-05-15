import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'
import { useAuth } from '@/features/auth/AuthContext'
import { useDriverProfileId } from '@/features/driver/useDriverProfileId'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api/client'
import { getDriver, patchDriver } from '@/services/api/drivers'
import { updateTenantUser } from '@/services/api/users'

const DRIVER_AVATAR = '/stitch/driver-submit-request/driver-avatar.jpg'

const MIN_PASSWORD = 8

export function DriverProfilePage() {
  const { user, refreshUser } = useAuth()
  const { pushToast } = useToast()
  const qc = useQueryClient()

  const { data: driverId, isLoading: driverIdLoading } = useDriverProfileId()

  const driverQuery = useQuery({
    queryKey: ['driver', 'detail', driverId],
    queryFn: () => getDriver(driverId!),
    enabled: driverId != null,
  })

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    setEmail(user.email ?? '')
  }, [user])

  useEffect(() => {
    const d = driverQuery.data
    if (!d) return
    setPhone(d.phone ?? '')
  }, [driverQuery.data])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in')

      const trimmedName = name.trim()
      const trimmedEmail = email.trim()
      const pass = newPassword.trim()
      if (pass && pass !== confirmPassword.trim()) {
        throw new Error('New password and confirmation do not match.')
      }
      if (pass && pass.length < MIN_PASSWORD) {
        throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`)
      }

      await updateTenantUser(user.id, {
        name: trimmedName,
        email: trimmedEmail,
        ...(pass ? { password: pass } : {}),
      })

      if (driverId != null) {
        const trimmedPhone = phone.trim()
        if (!trimmedPhone) {
          throw new Error('Phone is required for your driver profile.')
        }
        await patchDriver(driverId, {
          full_name: trimmedName,
          phone: trimmedPhone,
        })
      }

      await refreshUser()
    },
    onSuccess: () => {
      pushToast('success', 'Profile updated.')
      setEditing(false)
      setNewPassword('')
      setConfirmPassword('')
      void qc.invalidateQueries({ queryKey: ['driver', 'detail', driverId] })
      void qc.invalidateQueries({ queryKey: ['driver-profile-id'] })
      void qc.invalidateQueries({ queryKey: ['driver-scope'] })
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiError ? e.firstFieldError() ?? e.message : e instanceof Error ? e.message : 'Could not update profile.'
      pushToast('error', msg)
    },
  })

  if (!user) {
    return null
  }

  if (driverIdLoading) {
    return (
      <main className="mx-auto max-w-md space-y-6 px-6 pb-36 pt-8">
        <LoadingSkeleton className="h-40 w-full" />
      </main>
    )
  }

  const d = driverQuery.data
  const zoneLabel =
    d?.zone && typeof d.zone.name === 'string' ? d.zone.name : d?.zone_id != null ? `#${d.zone_id}` : '—'
  const driverLoading = driverId != null && driverQuery.isLoading

  const passTrim = newPassword.trim()
  const confirmTrim = confirmPassword.trim()
  /** Block save when password fields are inconsistent or too short. */
  const passwordInvalid =
    (passTrim.length === 0) !== (confirmTrim.length === 0) ||
    (passTrim.length > 0 && (passTrim !== confirmTrim || passTrim.length < MIN_PASSWORD))

  const disableSave =
    saveMut.isPending ||
    !name.trim() ||
    !email.trim() ||
    (driverId != null && !phone.trim()) ||
    passwordInvalid

  return (
    <main className="mx-auto max-w-md space-y-8 px-6 pb-36 pt-8">
      <section className="flex flex-col items-center text-center">
        <div className="mb-4 size-24 overflow-hidden rounded-full border-4 border-primary-fixed shadow-md">
          <img alt="" className="size-full object-cover" decoding="async" src={DRIVER_AVATAR} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-primary dark:text-white">
          {name.trim() || user.name || 'Driver'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{email.trim() || user.email}</p>
      </section>

      <section className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-[var(--shadow-soft)] dark:bg-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Account</h2>
          {!editing ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Sign-in email and password are updated via your account. Changes are saved with your user record.
        </p>

        <div className="space-y-4">
          <div>
            <label
              className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
              htmlFor="driver-profile-name"
            >
              Name
            </label>
            <input
              id="driver-profile-name"
              className={cn(
                'w-full rounded-lg border border-transparent bg-surface-high px-3 py-2.5 text-base font-semibold text-foreground outline-none transition-colors',
                editing ? 'border-border focus:border-primary' : 'cursor-default opacity-90',
              )}
              readOnly={!editing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
              htmlFor="driver-profile-email"
            >
              Email
            </label>
            <input
              id="driver-profile-email"
              type="email"
              className={cn(
                'w-full rounded-lg border border-transparent bg-surface-high px-3 py-2.5 text-base font-semibold text-foreground outline-none transition-colors',
                editing ? 'border-border focus:border-primary' : 'cursor-default opacity-90',
              )}
              readOnly={!editing}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          {editing ? (
            <>
              <div>
                <label
                  className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                  htmlFor="driver-profile-password"
                >
                  New password
                </label>
                <input
                  id="driver-profile-password"
                  type="password"
                  className="w-full rounded-lg border border-border bg-surface-high px-3 py-2.5 text-base font-semibold text-foreground outline-none focus:border-primary"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                  htmlFor="driver-profile-password-confirm"
                >
                  Confirm new password
                </label>
                <input
                  id="driver-profile-password-confirm"
                  type="password"
                  className="w-full rounded-lg border border-border bg-surface-high px-3 py-2.5 text-base font-semibold text-foreground outline-none focus:border-primary"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum {MIN_PASSWORD} characters when changing password.
              </p>
            </>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-[var(--shadow-soft)] dark:bg-card">
        <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Fleet (driver)</h2>
        {driverLoading ? (
          <LoadingSkeleton className="h-24 w-full" />
        ) : driverId != null ? (
          <>
            <div>
              <label
                className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                htmlFor="driver-profile-phone"
              >
                Phone
              </label>
              <input
                id="driver-profile-phone"
                className={cn(
                  'w-full rounded-lg border border-transparent bg-surface-high px-3 py-2.5 text-base font-semibold text-foreground outline-none transition-colors',
                  editing ? 'border-border focus:border-primary' : 'cursor-default opacity-90',
                )}
                readOnly={!editing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Zone</p>
              <p className="rounded-lg bg-surface-high px-3 py-2.5 text-base font-semibold text-foreground/80">
                {zoneLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Zone is assigned by your fleet manager.</p>
            </div>
            {!editing ? null : (
              <p className="text-xs text-muted-foreground">
                Saving also updates your driver contact record so fleet operations stay in sync with your display name.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No driver record is linked to this account yet, so fleet phone and zone are unavailable. Ask your administrator
            to link your driver profile if needed.
          </p>
        )}
      </section>

      {editing ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={disableSave} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saveMut.isPending}
            onClick={() => {
              setEditing(false)
              setName(user.name ?? '')
              setEmail(user.email ?? '')
              setNewPassword('')
              setConfirmPassword('')
              if (d) {
                setPhone(d.phone ?? '')
              }
            }}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </main>
  )
}
