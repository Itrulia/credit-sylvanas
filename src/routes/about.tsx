import { Link, createFileRoute } from '@tanstack/react-router'
import { DATA_LOG_HEADING_ID, DataLog } from '#/components/about/data-log'
import { Credit, NOT_AFFILIATED } from '#/components/credit'
import { GLOSSARY } from '#/components/glossary'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { m } from '#/paraglide/messages.js'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/about')({
  ssr: true,
  head: () =>
    pageHead(
      m.legal_aboutHeadTitle(),
      m.legal_aboutHeadDescription({ site: SITE }),
    ),
  component: About,
})

function About() {
  return (
    <ProsePage
      title={m.legal_aboutTitle()}
      intro={<p>{m.legal_aboutIntro({ site: SITE })}</p>}
    >
      <ProseSection title={m.legal_aboutNumbersTitle()}>
        <dl className="space-y-4">
          {Object.values(GLOSSARY).map((entry) => (
            <div key={entry.label}>
              <dt className="font-semibold">{entry.label}</dt>
              <dd className="text-muted-foreground">{entry.text}</dd>
            </div>
          ))}
        </dl>
      </ProseSection>

      <ProseSection title={m.legal_aboutSourceTitle()}>
        <p>{m.legal_aboutSourceFiles()}</p>
        <p>{m.legal_aboutSourceHistory()}</p>
      </ProseSection>

      <ProseSection
        id={DATA_LOG_HEADING_ID}
        title={m.legal_aboutDataLogTitle()}
      >
        <p>{m.legal_aboutDataLogText()}</p>
        <DataLog />
      </ProseSection>

      <ProseSection title={m.legal_aboutCreditTitle()}>
        <p>
          <Credit />.
        </p>
        <p>{NOT_AFFILIATED}</p>
      </ProseSection>

      <ProseSection title={m.legal_aboutNoApiTitle()}>
        <p>{m.legal_aboutNoApiText()}</p>
      </ProseSection>

      <ProseSection title={m.legal_aboutPrivacyTitle()}>
        <p>{m.legal_aboutPrivacyText()}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{m.legal_aboutPrivacyCloudflare()}</li>
          <li>{m.legal_aboutPrivacyUmami()}</li>
          <li>{m.legal_aboutPrivacyWowhead()}</li>
        </ul>
        <p>
          {m.legal_aboutPrivacyMoreLead()}{' '}
          <Link to="/privacy" className="underline">
            {m.legal_aboutPrivacyMoreLink()}
          </Link>{' '}
          {m.legal_aboutPrivacyMoreTail()}
        </p>
      </ProseSection>
    </ProsePage>
  )
}
