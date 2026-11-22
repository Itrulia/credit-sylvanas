import { Link, createFileRoute } from '@tanstack/react-router'
import { ContactEmail } from '#/components/contact-email'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { m } from '#/i18n'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/privacy')({
  ssr: true,
  head: () =>
    pageHead(
      m.legal.privacyHeadTitle(),
      m.legal.privacyHeadDescription({ site: SITE }),
    ),
  component: Privacy,
})

const REVIEWED = '2026-11-22'

function Privacy() {
  return (
    <ProsePage
      title={m.legal.privacyTitle()}
      intro={<p>{m.legal.privacyIntro({ site: SITE, reviewed: REVIEWED })}</p>}
    >
      <ProseSection title={m.legal.privacyResponsibleTitle()}>
        <p>
          {m.legal.privacyResponsibleLead({ site: SITE })}{' '}
          <Link to="/impressum" className="underline">
            {m.legal.privacyResponsibleLink()}
          </Link>
          {m.legal.privacyResponsibleTail()}
        </p>
        <p>
          {m.legal.emailLabel()} <ContactEmail />
        </p>
      </ProseSection>

      <ProseSection title={m.legal.privacyHostingTitle()}>
        <p>{m.legal.privacyHostingText()}</p>
        <p>{m.legal.privacyHostingLogs()}</p>
      </ProseSection>

      <ProseSection title={m.legal.privacyStatsTitle()}>
        <p>{m.legal.privacyStatsText()}</p>
        <p>{m.legal.privacyStatsDetails()}</p>
      </ProseSection>

      <ProseSection title={m.legal.privacyTooltipsTitle()}>
        <p>{m.legal.privacyTooltipsText()}</p>
      </ProseSection>

      <ProseSection title={m.legal.privacyFontsTitle()}>
        <p>{m.legal.privacyFontsText()}</p>
      </ProseSection>

      <ProseSection title={m.legal.privacyPurposeTitle()}>
        <p>{m.legal.privacyPurposeText()}</p>
      </ProseSection>

      <ProseSection title={m.legal.privacyRightsTitle()}>
        <p>{m.legal.privacyRightsText()}</p>
        <p>{m.legal.privacyRightsComplaint()}</p>
      </ProseSection>
    </ProsePage>
  )
}
