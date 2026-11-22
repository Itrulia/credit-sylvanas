import { Link, createFileRoute } from '@tanstack/react-router'
import { REGIONS, REGION_INFO } from '#/config/regions'
import type { RegionCode } from '#/config/regions'
import { Credit } from '#/components/credit'
import { Icon } from '#/components/icon'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/')({
  ssr: true,
  head: () =>
    pageHead(
      'WoW Forever auction house prices',
      'Daily World of Warcraft Forever auction house prices for US, EU, KR and TW, with price history. Pricing data from TradeSkillMaster.',
    ),
  component: Home,
})

// full class names so Tailwind sees them
const REGION_BAR: Record<RegionCode, string> = {
  us: 'bg-region-us',
  eu: 'bg-region-eu',
  kr: 'bg-region-kr',
  tw: 'bg-region-tw',
}

function Home() {
  return (
    <div className="page-wrap py-10 sm:py-16">
      <div className="ledger-rule max-w-3xl pb-6">
        <h1 className="text-display sm:text-[2.75rem] sm:leading-[3rem]">
          WoW Forever auction house prices
        </h1>
        <p className="mt-3 max-w-prose text-lg text-muted-foreground">
          Pick a region to see what items sell for today, what's moving and how
          prices changed over the last 90 days.
        </p>
      </div>

      <ul
        aria-label="Regions"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {REGIONS.map((region) => {
          const info = REGION_INFO[region]
          return (
            <li key={region}>
              <Link
                to="/$region"
                params={{ region }}
                className="group relative flex min-h-36 flex-col overflow-hidden rounded-md border bg-card p-5 pl-6 transition-colors hover:border-border-strong hover:bg-accent focus-visible:border-border-strong"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1 ${REGION_BAR[region]}`}
                />
                <span className="text-display text-primary">{info.name}</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  {info.fullName}
                </span>
                {/* visual cue only: the link is already named by region */}
                <span
                  aria-hidden="true"
                  className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium"
                >
                  {info.name} market
                  <Icon
                    name="chevron_right"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="mt-8 text-sm text-muted-foreground">
        <Credit />, imported once a day.{' '}
        <Link to="/about" className="underline">
          How it works
        </Link>
      </p>
    </div>
  )
}
