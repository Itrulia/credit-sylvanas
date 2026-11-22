import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { m } from '#/i18n'
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
        {m.shell.docTitle({ page: m.shell.errorDocPage(), site: SITE })}
      </title>
      <meta name="robots" content="noindex" />
      <StatePanel
        as="h1"
        icon="error"
        title={m.shell.errorTitle()}
        actions={
          <Button onClick={() => void router.invalidate()}>
            {m.shell.retry()}
          </Button>
        }
      >
        <p>{m.shell.errorBody()}</p>
      </StatePanel>
    </div>
  )
}
