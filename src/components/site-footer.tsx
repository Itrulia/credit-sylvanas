import { Link } from '@tanstack/react-router'
import { m } from '#/paraglide/messages.js'
import { Credit, NOT_AFFILIATED } from './credit'

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t py-6 text-micro text-muted-foreground">
      <div className="page-wrap flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <p>
            <Credit />
          </p>
          <p className="max-w-prose">{NOT_AFFILIATED}</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          <li>
            <Link to="/about" className="underline">
              {m.shell_footerAbout()}
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="underline">
              {m.shell_footerPrivacy()}
            </Link>
          </li>
          <li>
            <Link to="/impressum" className="underline">
              {m.shell_footerImpressum()}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
