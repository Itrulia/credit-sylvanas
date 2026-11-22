import { Link, createFileRoute } from '@tanstack/react-router'
import { REGIONS, REGION_INFO } from '#/config/regions'
import { Credit } from '#/components/credit'

// Stub: WP4 owns this page.
export const Route = createFileRoute('/')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'WoW Forever auction house prices · Worgen of Booty Bay' },
      {
        name: 'description',
        content:
          'Daily World of Warcraft Forever auction house prices for US, EU, KR and TW, with price history. Pricing data from TradeSkillMaster.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  return (
    <div className="page-wrap py-8">
      <h1 className="text-display">WoW Forever auction house prices</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REGIONS.map((region) => (
          <li key={region}>
            <Link
              to="/$region"
              params={{ region }}
              className="block rounded-md border bg-card p-4 hover:bg-accent"
            >
              <span className="text-title">{REGION_INFO[region].name}</span>
              <span className="block text-sm text-muted-foreground">
                {REGION_INFO[region].fullName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <Credit />
      </p>
    </div>
  )
}
