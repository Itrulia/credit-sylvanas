import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { DATA_LOG_HEADING_ID, DataLog } from '#/components/about/data-log'
import { Credit, NOT_AFFILIATED } from '#/components/credit'
import { GLOSSARY } from '#/components/glossary'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/about')({
  ssr: true,
  head: () =>
    pageHead(
      'About and data sources',
      `How ${SITE} gets its prices, what each number means and how often it updates.`,
    ),
  component: About,
})

function Section({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2
        id={id}
        tabIndex={-1}
        className="text-title border-b border-border-strong pb-2 outline-none"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function About() {
  return (
    <div className="page-wrap py-8">
      <div className="max-w-prose space-y-10 text-base leading-7">
        <header className="space-y-3">
          <h1 className="text-display">About this site</h1>
          <p className="text-muted-foreground">
            {SITE} shows what items sell for on the World of Warcraft Forever
            auction houses in the US, EU, Korea and Taiwan. All prices are in
            gold, silver and copper.
          </p>
        </header>

        <Section title="What the numbers mean">
          <dl className="space-y-4">
            {Object.values(GLOSSARY).map((entry) => (
              <div key={entry.label}>
                <dt className="font-semibold">{entry.label}</dt>
                <dd className="text-muted-foreground">{entry.text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Where the data comes from">
          <p>
            Every price comes from the public data files that TradeSkillMaster
            publishes. Region prices update once a day and realm prices every
            few hours. We download each file once per update.
          </p>
          <p>
            We keep every daily snapshot, so price history grows from the day we
            started. Charts and tables show the last 90 days. The pages with
            prices, and the data log below, say when each update was scanned and
            imported.
          </p>
        </Section>

        <Section id={DATA_LOG_HEADING_ID} title="Data log">
          <p>
            Each time we fetch a price file, we log when it happened, which scan
            it held, how many rows it had and a short fingerprint of the file. A
            skipped row means the file hadn't changed since the last fetch.
          </p>
          <DataLog />
        </Section>

        <Section title="Credit">
          <p>
            <Credit />.
          </p>
          <p>{NOT_AFFILIATED}</p>
        </Section>

        <Section title="No API or downloads">
          <p>
            There's no API, export or download here, because TradeSkillMaster's
            terms don't allow republishing their data in bulk.
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            No accounts and no cookies. Three outside services are involved:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Cloudflare hosts the site. Its servers see your IP address when
              you load a page.
            </li>
            <li>
              Umami counts page views from its EU servers without cookies and
              without storing IP addresses.
            </li>
            <li>
              Wowhead's tooltip script adds item icons and tooltips on price
              pages. It doesn't load on this page or the home page.
            </li>
          </ul>
        </Section>
      </div>
    </div>
  )
}
