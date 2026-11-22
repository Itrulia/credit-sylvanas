import { createFileRoute } from '@tanstack/react-router'
import { ContactEmail } from '#/components/contact-email'
import { Credit } from '#/components/credit'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { m } from '#/paraglide/messages.js'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/impressum')({
  ssr: true,
  head: () =>
    pageHead(
      m.legal_impressumHeadTitle(),
      m.legal_impressumHeadDescription({ site: SITE }),
    ),
  component: Impressum,
})

function Impressum() {
  return (
    <ProsePage
      title={m.legal_impressumTitle()}
      intro={<p>{m.legal_impressumIntro({ site: SITE })}</p>}
    >
      <ProseSection title={m.legal_impressumOperatorTitle()}>
        <p>{m.legal_impressumOperator({ site: SITE })}</p>
        <p>
          {m.legal_emailLabel()} <ContactEmail />
        </p>
      </ProseSection>

      <ProseSection title={m.legal_impressumSourceTitle()}>
        <p>
          <Credit />. {m.legal_impressumSourceText()}
        </p>
      </ProseSection>

      <ProseSection title={m.legal_impressumNotAffiliatedTitle()}>
        <p>{m.legal_impressumNotAffiliatedText({ site: SITE })}</p>
      </ProseSection>

      <ProseSection title={m.legal_impressumTrademarksTitle()}>
        <p>{m.legal_impressumTrademarksText()}</p>
      </ProseSection>

      <ProseSection title={m.legal_impressumLinksTitle()}>
        <p>{m.legal_impressumLinksText()}</p>
      </ProseSection>
    </ProsePage>
  )
}
