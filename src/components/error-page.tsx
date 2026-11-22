import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { StatePanel } from './state-panel'
import { Button } from './ui/button'

// Stub: WP4 owns the content. An uncaught loader error answers 500.
export function ErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter()
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="page-wrap py-8">
      <StatePanel
        as="h1"
        icon="error"
        title="Something broke on our side."
        actions={
          <Button onClick={() => void router.invalidate()}>Try again</Button>
        }
      >
        {/* no stack trace in production */}
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="text-micro whitespace-pre-wrap">{error.message}</pre>
        )}
      </StatePanel>
    </div>
  )
}
