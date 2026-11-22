import { Link, createFileRoute } from '@tanstack/react-router'
import { ContactEmail } from '#/components/contact-email'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { m } from '#/paraglide/messages.js'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/privacy')({
  ssr: true,
  head: () =>
    pageHead(
      m.legal_privacyHeadTitle(),
      m.legal_privacyHeadDescription({ site: SITE }),
    ),
  component: Privacy,
})

const REVIEWED = '2026-11-22'

function Privacy() {
  return (
    <ProsePage
      title={m.legal_privacyTitle()}
      intro={<p>{m.legal_privacyIntro({ site: SITE, reviewed: REVIEWED })}</p>}
    >
      <ProseSection title={m.legal_privacyResponsibleTitle()}>
        <p>
          {m.legal_privacyResponsibleLead({ site: SITE })}{' '}
          <Link to="/impressum" className="underline">
            {m.legal_privacyResponsibleLink()}
          </Link>
          {m.legal_privacyResponsibleTail()}
        </p>
        <p>
          {m.legal_emailLabel()} <ContactEmail />
        </p>
      </ProseSection>

      <ProseSection title={m.legal_privacyHostingTitle()}>
        <p>{m.legal_privacyHostingText()}</p>
        <p>{m.legal_privacyHostingLogs()}</p>
      </ProseSection>

      <ProseSection title={m.legal_privacyStatsTitle()}>
        <p>{m.legal_privacyStatsText()}</p>
        <p>{m.legal_privacyStatsDetails()}</p>
      </ProseSection>

      <ProseSection title={m.legal_privacyTooltipsTitle()}>
        <p>{m.legal_privacyTooltipsText()}</p>
      </ProseSection>

      <ProseSection title={m.legal_privacyFontsTitle()}>
        <p>{m.legal_privacyFontsText()}</p>
      </ProseSection>

      <ProseSection title={m.legal_privacyPurposeTitle()}>
        <p>{m.legal_privacyPurposeText()}</p>
      </ProseSection>

      <ProseSection title={m.legal_privacyRightsTitle()}>
        <p>{m.legal_privacyRightsText()}</p>
        <p>{m.legal_privacyRightsComplaint()}</p>
      </ProseSection>
    </ProsePage>
  )
}
