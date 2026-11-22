import { createFileRoute } from '@tanstack/react-router'
import { Credit, NOT_AFFILIATED } from '#/components/credit'
import { pageHead } from '#/lib/seo'

// Stub: WP4 owns this page (glossary, cadence, Data log).
export const Route = createFileRoute('/about')({
  ssr: true,
  head: () =>
    pageHead(
      'About and data sources',
      'How Worgen of Booty Bay gets its prices, what each number means and how often it updates.',
    ),
  component: About,
})

function About() {
  return (
    <div className="page-wrap prose py-8 text-base">
      <h1 className="text-display">About this site</h1>
      <p>
        <Credit />
      </p>
      <p>{NOT_AFFILIATED}</p>
    </div>
  )
}
