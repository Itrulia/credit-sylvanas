import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { m } from '#/paraglide/messages.js'
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
      <title>
        {m.shell_docTitle({ page: m.shell_errorDocPage(), site: SITE })}
      </title>
      <meta name="robots" content="noindex" />
      <StatePanel
        as="h1"
        icon="error"
        title={m.shell_errorTitle()}
        actions={
          <Button onClick={() => void router.invalidate()}>
            {m.shell_retry()}
          </Button>
        }
      >
        <p>{m.shell_errorBody()}</p>
      </StatePanel>
    </div>
  )
}
