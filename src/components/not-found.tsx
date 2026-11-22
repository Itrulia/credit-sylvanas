import { Link } from '@tanstack/react-router'
import { StatePanel } from './state-panel'

// Stub: WP4 owns the content. The 404 status comes from throw notFound() in loaders.
export function NotFound() {
  return (
    <div className="page-wrap py-8">
      <title>Page not found · Worgen of Booty Bay</title>
      <meta name="robots" content="noindex" />
      <StatePanel as="h1" icon="search" title="Page not found">
        <p>That page doesn't exist. Try searching for an item instead.</p>
        <p>
          <Link to="/$region" params={{ region: 'us' }} className="underline">
            Go to US market
          </Link>
        </p>
      </StatePanel>
    </div>
  )
}
