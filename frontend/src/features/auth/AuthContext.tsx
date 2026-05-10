import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { getHomePath } from '@/features/auth/permissions'
import * as authApi from '@/services/api/auth'
import { clearAuthToken, getStoredToken, registerUnauthorizedHandler, setAuthToken } from '@/services/api/client'
import type { UserResource } from '@/services/api/types'

export function postLoginPath(user: UserResource): string {
  return getHomePath(user)
}

type AuthContextValue = {
  user: UserResource | null
  loading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<UserResource>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserResource | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      return
    }
    const u = await authApi.me()
    setUser(u)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!getStoredToken()) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const u = await authApi.me()
        if (!cancelled) setUser(u)
      } catch {
        clearAuthToken()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })
    return () => registerUnauthorizedHandler(null)
  }, [navigate])

  const login = useCallback(
    async (email: string, password: string, remember: boolean): Promise<UserResource> => {
      const data = await authApi.login({ email: email.trim(), password })
      setAuthToken(data.token, remember)
      setUser(data.user)
      return data.user
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* still clear local session */
    }
    clearAuthToken()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
