import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { track } from '#/lib/analytics'
import { SITE } from '#/lib/seo'
import { StatePanel } from './state-panel'
import { Button } from './ui/button'

/** Router default error page. An uncaught loader error answers 500. */
export function ErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter()
  // effects never run during SSR, and Workers observability needs the server log
  if (typeof window === 'undefined') {
    console.error(error)
  }
  useEffect(() => {
    console.error(error)
    track('error_page', { status: 500 })
  }, [error])
  return (
    <div className="page-wrap py-8">
      <title>{`Something broke · ${SITE}`}</title>
      <meta name="robots" content="noindex" />
      <StatePanel
        as="h1"
        icon="error"
        title="Something broke on our side."
        actions={
          <Button onClick={() => void router.invalidate()}>Try again</Button>
        }
      >
        <p>We've logged the error. Try again, or come back in a few minutes.</p>
        {/* no stack trace in production */}
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="text-micro whitespace-pre-wrap">{error.message}</pre>
        )}
      </StatePanel>
    </div>
  )
}
