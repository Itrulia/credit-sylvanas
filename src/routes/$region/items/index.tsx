import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { ITEMS_DEFAULTS, itemsSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'

// Stub: WP2 owns this page.
export const Route = createFileRoute('/$region/items/')({
  ssr: true,
  validateSearch: itemsSearch,
  search: { middlewares: [stripSearchParams(ITEMS_DEFAULTS)] },
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      `Item prices · ${name} Forever AH`,
      `Search and sort every item on the ${name} Forever auction house by market value, sale rate and daily sales.`,
    )
  },
  component: Items,
})

function Items() {
  return (
    <div className="page-wrap py-6">
      <h1 className="text-display">Item prices</h1>
    </div>
  )
}
