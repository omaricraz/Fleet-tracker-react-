import { AlertTriangle } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed with status ${error.status}.`
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Something went wrong while loading this page.'
}

export function RouteErrorPage() {
  const error = useRouteError()

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description={getErrorMessage(error)}
          action={
            <Button asChild>
              <Link to="/platform">Back to Platform</Link>
            </Button>
          }
        />
      </div>
    </main>
  )
}
