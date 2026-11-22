import { createFileRoute } from '@tanstack/react-router'
import { ContactEmail } from '#/components/contact-email'
import { Credit } from '#/components/credit'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/impressum')({
  ssr: true,
  head: () =>
    pageHead(
      'Impressum',
      `Who runs ${SITE}, how to reach us, and the trademark and link notes.`,
    ),
  component: Impressum,
})

function Impressum() {
  return (
    <ProsePage
      title="Impressum"
      intro={
        <p>
          {SITE} is a non-commercial fan project. It has no paid features and no
          ads.
        </p>
      }
    >
      <ProseSection title="Operator">
        <p>{SITE}, a non-commercial fan project.</p>
        <p>
          Email: <ContactEmail />
        </p>
      </ProseSection>

      <ProseSection title="Data source">
        <p>
          <Credit />. TradeSkillMaster publishes the files we read. We don't
          change the prices, but we can't promise they are complete or current.
        </p>
      </ProseSection>

      <ProseSection title="Not affiliated">
        <p>
          {SITE} is not affiliated with or endorsed by TradeSkillMaster,
          Blizzard Entertainment or Wowhead.
        </p>
      </ProseSection>

      <ProseSection title="Trademarks">
        <p>
          World of Warcraft and Blizzard Entertainment are trademarks or
          registered trademarks of Blizzard Entertainment, Inc. Other names
          belong to their owners.
        </p>
      </ProseSection>

      <ProseSection title="Links to other sites">
        <p>
          We link to TradeSkillMaster and Wowhead. Their owners are responsible
          for what those pages say. If we learn that a page we link to breaks
          the law, we remove the link.
        </p>
      </ProseSection>
    </ProsePage>
  )
}
