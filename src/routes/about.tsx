import { Link, createFileRoute } from '@tanstack/react-router'
import { DATA_LOG_HEADING_ID, DataLog } from '#/components/about/data-log'
import { Credit, NOT_AFFILIATED } from '#/components/credit'
import { GLOSSARY } from '#/components/glossary'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { m } from '#/i18n'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/about')({
  ssr: true,
  head: () =>
    pageHead(
      m.legal.aboutHeadTitle(),
      m.legal.aboutHeadDescription({ site: SITE }),
    ),
  component: About,
})

function About() {
  return (
    <ProsePage
      title={m.legal.aboutTitle()}
      intro={<p>{m.legal.aboutIntro({ site: SITE })}</p>}
    >
      <ProseSection title={m.legal.aboutNumbersTitle()}>
        <dl className="space-y-4">
          {Object.values(GLOSSARY).map((entry) => (
            <div key={entry.label}>
              <dt className="font-semibold">{entry.label}</dt>
              <dd className="text-muted-foreground">{entry.text}</dd>
            </div>
          ))}
        </dl>
      </ProseSection>

      <ProseSection title={m.legal.aboutSourceTitle()}>
        <p>{m.legal.aboutSourceFiles()}</p>
        <p>{m.legal.aboutSourceHistory()}</p>
      </ProseSection>

      <ProseSection
        id={DATA_LOG_HEADING_ID}
        title={m.legal.aboutDataLogTitle()}
      >
        <p>{m.legal.aboutDataLogText()}</p>
        <DataLog />
      </ProseSection>

      <ProseSection title={m.legal.aboutCreditTitle()}>
        <p>
          <Credit />.
        </p>
        <p>{NOT_AFFILIATED}</p>
      </ProseSection>

      <ProseSection title={m.legal.aboutNoApiTitle()}>
        <p>{m.legal.aboutNoApiText()}</p>
      </ProseSection>

      <ProseSection title={m.legal.aboutPrivacyTitle()}>
        <p>{m.legal.aboutPrivacyText()}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{m.legal.aboutPrivacyCloudflare()}</li>
          <li>{m.legal.aboutPrivacyUmami()}</li>
          <li>{m.legal.aboutPrivacyWowhead()}</li>
        </ul>
        <p>
          {m.legal.aboutPrivacyMoreLead()}{' '}
          <Link to="/privacy" className="underline">
            {m.legal.aboutPrivacyMoreLink()}
          </Link>{' '}
          {m.legal.aboutPrivacyMoreTail()}
        </p>
      </ProseSection>
    </ProsePage>
  )
}
