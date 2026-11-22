import { Link, createFileRoute } from '@tanstack/react-router'
import { ContactEmail } from '#/components/contact-email'
import { ProsePage, ProseSection } from '#/components/prose-page'
import { SITE, pageHead } from '#/lib/seo'

export const Route = createFileRoute('/privacy')({
  ssr: true,
  head: () =>
    pageHead(
      'Privacy',
      `What ${SITE} and the services it uses learn about you, and your rights under Swiss data protection law.`,
    ),
  component: Privacy,
})

const REVIEWED = '2026-11-22'

function Privacy() {
  return (
    <ProsePage
      title="Privacy"
      intro={
        <p>
          {SITE} has no accounts, sets no cookies and never asks for your name.
          This notice follows the Swiss Federal Act on Data Protection (FADP).
          Last updated {REVIEWED}.
        </p>
      }
    >
      <ProseSection title="Who is responsible">
        <p>
          {SITE}, a non-commercial fan project (see the{' '}
          <Link to="/impressum" className="underline">
            Impressum
          </Link>
          ).
        </p>
        <p>
          Email: <ContactEmail />
        </p>
      </ProseSection>

      <ProseSection title="Hosting: Cloudflare">
        <p>
          Cloudflare, Inc. hosts the site and delivers every page. To do that
          and to block attacks, its servers process your IP address, the page
          you ask for, your browser's user agent and the time. Cloudflare is a
          US company and may process this data outside Switzerland, including in
          the USA.
        </p>
        <p>
          Our server logs record requests and errors so we can fix problems.
          Cloudflare deletes them after 7 days.
        </p>
      </ProseSection>

      <ProseSection title="Visitor statistics: Umami">
        <p>
          Umami Cloud counts page views from servers in the EU. It also counts a
          few actions, such as switching region, sorting a table or opening an
          item, so we can see which features people use.
        </p>
        <p>
          Umami sets no cookies and doesn't store your IP address. We never send
          it what you type into search, and the query part of a page address is
          left out. If your browser sends Do Not Track, nothing is counted. The
          counts are anonymous, and we keep them for as long as the site runs.
        </p>
      </ProseSection>

      <ProseSection title="Item tooltips: Wowhead">
        <p>
          Every page except the home page, About, the Impressum and this one
          loads Wowhead's tooltip script from wow.zamimg.com to show item icons
          and tooltips. Your browser then connects to Wowhead, which sees your
          IP address and the page you are on. Wowhead's own privacy policy
          covers that data.
        </p>
      </ProseSection>

      <ProseSection title="Fonts">
        <p>
          We host every font ourselves, so your browser never contacts Google or
          another font service.
        </p>
      </ProseSection>

      <ProseSection title="Why we process data">
        <p>
          To deliver the site, keep it secure and running, and see which pages
          and features get used. We don't sell data, show ads or build profiles
          of visitors.
        </p>
      </ProseSection>

      <ProseSection title="Your rights">
        <p>
          You can ask what data about you we hold, and ask us to correct or
          delete it. We hold almost nothing that identifies a person, but we
          will check and answer. Write to the email address above.
        </p>
        <p>
          You can also complain to the Federal Data Protection and Information
          Commissioner (FDPIC).
        </p>
      </ProseSection>
    </ProsePage>
  )
}
