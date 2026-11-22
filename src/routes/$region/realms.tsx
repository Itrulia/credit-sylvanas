import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { realmsSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'

// Stub: WP4 owns this page.
export const Route = createFileRoute('/$region/realms')({
  ssr: true,
  validateSearch: realmsSearch,
  search: { middlewares: [stripSearchParams({ ruleset: 'all' })] },
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      `Realms · ${name} Forever AH`,
      `Pick a ${name} Forever realm to see realm prices.`,
    )
  },
  component: Realms,
})

function Realms() {
  return (
    <div className="page-wrap py-6">
      <h1 className="text-display">Realms</h1>
    </div>
  )
}
