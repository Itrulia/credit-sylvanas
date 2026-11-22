import { Link, createFileRoute } from '@tanstack/react-router'
import { DATA_LOG_HEADING_ID, DataLog } from '#/components/about/data-log'
import { Credit, NOT_AFFILIATED } from '#/components/credit'
import { GLOSSARY } from '#/components/glossary'
import { ProsePage, ProseSection } from '#/components/prose-page'
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

function About() {
  return (
    <ProsePage
      title="About this site"
      intro={
        <p>
          {SITE} shows what items sell for on the World of Warcraft Forever
          auction houses in the EU and NA regions. All prices are in gold,
          silver and copper.
        </p>
      }
    >
      <ProseSection title="What the numbers mean">
        <dl className="space-y-4">
          {Object.values(GLOSSARY).map((entry) => (
            <div key={entry.label}>
              <dt className="font-semibold">{entry.label}</dt>
              <dd className="text-muted-foreground">{entry.text}</dd>
            </div>
          ))}
        </dl>
      </ProseSection>

      <ProseSection title="Where the data comes from">
        <p>
          Every price comes from the public data files that TradeSkillMaster
          publishes. Region prices update once a day. We download each file
          once per update.
        </p>
        <p>
          We keep every daily snapshot, so price history grows from the day we
          started. Charts and tables show the last 90 days. The pages with
          prices, and the data log below, say when each update was scanned and
          imported.
        </p>
      </ProseSection>

      <ProseSection id={DATA_LOG_HEADING_ID} title="Data log">
        <p>
          Each time we fetch a price file, we log when it happened, which scan
          it held, how many rows it had and a short fingerprint of the file. A
          skipped row means the file hadn't changed since the last fetch.
        </p>
        <DataLog />
      </ProseSection>

      <ProseSection title="Credit">
        <p>
          <Credit />.
        </p>
        <p>{NOT_AFFILIATED}</p>
      </ProseSection>

      <ProseSection title="No API or downloads">
        <p>
          There's no API, export or download here, because TradeSkillMaster's
          terms don't allow republishing their data in bulk.
        </p>
      </ProseSection>

      <ProseSection title="Privacy">
        <p>
          No accounts and no cookies. We host every font ourselves. Three
          outside services are involved:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Cloudflare hosts the site. Its servers see your IP address when you
            load a page, and our request and error logs are deleted after 7
            days.
          </li>
          <li>
            Umami counts page views and a few actions from its EU servers,
            without cookies and without storing IP addresses. It never gets your
            search terms, and it counts nothing if your browser sends Do Not
            Track.
          </li>
          <li>
            Wowhead's tooltip script adds item icons and tooltips. It loads on
            every price page, but not on this page, the home page or the legal
            pages.
          </li>
        </ul>
        <p>
          The{' '}
          <Link to="/privacy" className="underline">
            privacy notice
          </Link>{' '}
          has the details and your rights.
        </p>
      </ProseSection>
    </ProsePage>
  )
}
