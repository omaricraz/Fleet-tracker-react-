import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The requested route is outside the current Fleet Tracker foundation. Use the primary workspace entry to continue."
          action={
            <Button asChild>
              <Link to="/platform">Go to Platform</Link>
            </Button>
          }
        />
      </div>
    </main>
  )
}
