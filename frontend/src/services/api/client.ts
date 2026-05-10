import type { ApiErrorEnvelope, ApiSuccessEnvelope } from './types'

const TOKEN_LS = 'fleet_tracker_auth_token'
const TOKEN_SS = 'fleet_tracker_auth_token'

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (raw?.replace(/\/$/, '') || 'http://localhost:8000/api/v1').trim()
}

function readToken(): string | null {
  return localStorage.getItem(TOKEN_LS) ?? sessionStorage.getItem(TOKEN_SS)
}

export function getStoredToken(): string | null {
  return readToken()
}

export function setAuthToken(token: string, remember: boolean): void {
  clearAuthToken()
  if (remember) {
    localStorage.setItem(TOKEN_LS, token)
  } else {
    sessionStorage.setItem(TOKEN_SS, token)
  }
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_LS)
  sessionStorage.removeItem(TOKEN_SS)
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>
  readonly details: ApiErrorEnvelope['details']

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
    details?: ApiErrorEnvelope['details'],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.details = details
  }

  firstFieldError(): string | undefined {
    for (const msgs of Object.values(this.errors)) {
      if (msgs?.[0]) return msgs[0]
    }
    return undefined
  }
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

function buildHeaders(init: HeadersInit | undefined, token: string | null, isJsonBody: boolean): Headers {
  const h = new Headers(init)
  h.set('Accept', 'application/json')
  if (isJsonBody && !h.has('Content-Type')) {
    h.set('Content-Type', 'application/json')
  }
  if (token) {
    h.set('Authorization', `Bearer ${token}`)
  }
  return h
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  skipAuth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers: initHeaders, ...rest } = options
  const isJsonBody = body !== undefined && !(body instanceof FormData)
  const token = skipAuth ? null : readToken()
  const headers = buildHeaders(initHeaders, token, isJsonBody)

  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError(text || 'Invalid JSON response', res.status)
  }

  if (res.status === 401 && !skipAuth) {
    clearAuthToken()
    onUnauthorized?.()
  }

  if (json && typeof json === 'object' && 'success' in json) {
    const envelope = json as ApiSuccessEnvelope<T> | ApiErrorEnvelope
    if (!envelope.success) {
      const err = envelope as ApiErrorEnvelope
      throw new ApiError(
        err.message || 'Request failed',
        res.status,
        err.errors || {},
        err.details,
      )
    }
    return (envelope as ApiSuccessEnvelope<T>).data
  }

  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}`, res.status)
  }

  return json as T
}
