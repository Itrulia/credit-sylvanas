import { createFileRoute } from '@tanstack/react-router'
import { ContactEmail } from '#/components/contact-email'
import { Credit } from '#/components/credit'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { m } from '#/i18n'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/impressum')({
  ssr: true,
  head: () =>
    pageHead(
      m.legal.impressumHeadTitle(),
      m.legal.impressumHeadDescription({ site: SITE }),
    ),
  component: Impressum,
})

function Impressum() {
  return (
    <ProsePage
      title={m.legal.impressumTitle()}
      intro={<p>{m.legal.impressumIntro({ site: SITE })}</p>}
    >
      <ProseSection title={m.legal.impressumOperatorTitle()}>
        <p>{m.legal.impressumOperator({ site: SITE })}</p>
        <p>
          {m.legal.emailLabel()} <ContactEmail />
        </p>
      </ProseSection>

      <ProseSection title={m.legal.impressumSourceTitle()}>
        <p>
          <Credit />. {m.legal.impressumSourceText()}
        </p>
      </ProseSection>

      <ProseSection title={m.legal.impressumNotAffiliatedTitle()}>
        <p>{m.legal.impressumNotAffiliatedText({ site: SITE })}</p>
      </ProseSection>

      <ProseSection title={m.legal.impressumTrademarksTitle()}>
        <p>{m.legal.impressumTrademarksText()}</p>
      </ProseSection>

      <ProseSection title={m.legal.impressumLinksTitle()}>
        <p>{m.legal.impressumLinksText()}</p>
      </ProseSection>
    </ProsePage>
  )
}
