import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { postLoginPath, useAuth } from '@/features/auth/AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <LoadingSkeleton className="h-24 w-full max-w-md" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <LoadingSkeleton className="h-24 w-full max-w-md" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={postLoginPath(user)} replace />
  }

  return <>{children}</>
}
