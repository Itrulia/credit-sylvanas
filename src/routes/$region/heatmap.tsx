import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { HEATMAP_DEFAULTS, heatmapSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'

// Stub: WP5 owns this page.
export const Route = createFileRoute('/$region/heatmap')({
  ssr: true,
  validateSearch: heatmapSearch,
  search: { middlewares: [stripSearchParams(HEATMAP_DEFAULTS)] },
  loaderDeps: ({ search }) => ({ n: search.n }),
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      `Heatmaps · ${name} Forever AH`,
      `See where the top ${name} Forever auction house items are pricier or cheaper: across regions, against their 60-day average, and day by day. Pricing data from TradeSkillMaster.`,
    )
  },
  component: Heatmaps,
})

function Heatmaps() {
  return (
    <div className="page-wrap py-6">
      <h1 className="text-display">Price heatmaps</h1>
    </div>
  )
}
