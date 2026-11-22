import { Link, createFileRoute } from '@tanstack/react-router'
import { DISABLED_REGIONS, REGIONS, REGION_INFO } from '#/config/regions'
import type { RegionCode } from '#/config/regions'
import { Credit } from '#/components/credit'
import { Icon } from '#/components/icon'
import { pageHead, websiteLd } from '#/lib/seo'
import { m } from '#/paraglide/messages.js'

export const Route = createFileRoute('/')({
  ssr: true,
  head: () => ({
    ...pageHead(m.home_title(), m.home_description()),
    scripts: [websiteLd()],
  }),
  component: Home,
})

// full class names so Tailwind sees them
const REGION_BAR: Record<RegionCode, string> = {
  us: 'bg-region-us',
  eu: 'bg-region-eu',
}

function Home() {
  return (
    <div className="page-wrap py-10 sm:py-16">
      <div className="ledger-rule max-w-3xl pb-6">
        <h1 className="text-display sm:text-[2.75rem] sm:leading-[3rem]">
          {m.home_title()}
        </h1>
        <p className="mt-3 max-w-prose text-lg text-muted-foreground">
          {m.home_intro()}
        </p>
      </div>

      <ul
        aria-label={m.home_regionsLabel()}
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
                  {m.home_regionCta({ region: info.name })}
                  <Icon
                    name="chevron_right"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </span>
              </Link>
            </li>
          )
        })}
        {DISABLED_REGIONS.map((r) => (
          <li key={r.code}>
            <div
              aria-disabled="true"
              className="flex min-h-36 cursor-not-allowed flex-col rounded-md border border-dashed p-5 pl-6 text-muted-foreground"
            >
              <span className="text-display">{r.name}</span>
              <span className="mt-1 text-sm">{r.fullName}</span>
              <span className="mt-auto pt-4 text-sm">
                {m.home_regionUnavailable()}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-muted-foreground">
        <Credit />
        {m.home_creditTail()}{' '}
        <Link to="/about" className="underline">
          {m.home_howItWorks()}
        </Link>
      </p>
    </div>
  )
}
