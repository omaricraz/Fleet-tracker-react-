import { apiRequest } from './client'
import type { UserResource } from './types'

export interface LoginBody {
  email: string
  password: string
}

export interface LoginData {
  token: string
  user: UserResource
}

export function login(body: LoginBody): Promise<LoginData> {
  return apiRequest<LoginData>('/auth/login', { method: 'POST', body, skipAuth: true })
}

export function logout(): Promise<Record<string, never>> {
  return apiRequest<Record<string, never>>('/auth/logout', { method: 'POST' })
}

export function me(): Promise<UserResource> {
  return apiRequest<UserResource>('/auth/me', { method: 'GET' })
}
