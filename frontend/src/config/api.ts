/**
 * Central API base URL from Vite env (`VITE_API_BASE_URL`).
 * Set in `.env.development` / `.env.production` at the repo root (see vite `envDir`).
 */
function readApiBaseUrlFromEnv(): string | undefined {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  const trimmed = raw?.trim()
  return trimmed ? trimmed.replace(/\/$/, '') : undefined
}

export function getApiBaseUrl(): string {
  const base = readApiBaseUrlFromEnv()
  if (!base) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Add it to .env.development or .env.production (e.g. VITE_API_BASE_URL=http://localhost:5000/api/v1).',
    )
  }
  return base
}

/** Build a full API URL from a path segment (with or without leading slash). */
export function buildApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalized}`
}
