import { readFileSync, readdirSync } from 'node:fs'
import ts from 'typescript'
import { expect, it } from 'vitest'

/**
 * Files that still hold inline copy. Extraction removes a file from here once
 * its text lives in src/i18n/en; the list must end empty.
 */
const ALLOWLIST: Array<string> = [
  'src/components/command-palette/command-palette-trigger.tsx',
  'src/components/command-palette/command-palette.tsx',
  'src/components/contact-email.tsx',
  'src/components/context-bar.tsx',
  'src/components/credit.tsx',
  'src/components/data-table.tsx',
  'src/components/delta.tsx',
  'src/components/diverging-legend.tsx',
  'src/components/error-page.tsx',
  'src/components/freshness.tsx',
  'src/components/heatmap/cross-region-table.tsx',
  'src/components/heatmap/daily-change-skeleton.tsx',
  'src/components/heatmap/daily-change-table.tsx',
  'src/components/heatmap/heatmap-controls.tsx',
  'src/components/heatmap/momentum-grid.tsx',
  'src/components/info-popover.tsx',
  'src/components/item/dot-heatmap.tsx',
  'src/components/item/favourite-button.tsx',
  'src/components/item/item-not-found.tsx',
  'src/components/item/price-block.tsx',
  'src/components/item/realm-prices.tsx',
  'src/components/item/region-compare-card.tsx',
  'src/components/item/region-strip.tsx',
  'src/components/item/stat-card.tsx',
  'src/components/item/stats-grid.tsx',
  'src/components/item/value-quantity-card.tsx',
  'src/components/market/hottest-table.tsx',
  'src/components/market/market-map-skeleton.tsx',
  'src/components/market/market-map.tsx',
  'src/components/market/mover-bars.tsx',
  'src/components/market/rising-table.tsx',
  'src/components/no-data.tsx',
  'src/components/not-found.tsx',
  'src/components/realms/realm-list.tsx',
  'src/components/region-nav.tsx',
  'src/components/search/item-search-group.tsx',
  'src/components/section-boundary.tsx',
  'src/components/site-footer.tsx',
  'src/components/site-header.tsx',
  'src/components/stale-banner.tsx',
  'src/components/wowhead-link.tsx',
  'src/routes/$region/heatmap.tsx',
  'src/routes/$region/index.tsx',
  'src/routes/$region/items/$itemId.tsx',
  'src/routes/$region/realms.tsx',
  'src/routes/__root.tsx',
  'src/routes/index.tsx',
]

const SKIP = [
  /\.test\.tsx$/,
  /^src\/components\/ui\//,
  /^src\/routeTree\.gen\.ts$/,
  /^src\/components\/devtools\.tsx$/,
]

// Props whose string value a person reads or hears. `name` is left out: it is
// mostly a form field or item name, never copy on its own.
const COPY_PROPS = new Set([
  'aria-label',
  'aria-description',
  'aria-valuetext',
  'aria-roledescription',
  'title',
  'placeholder',
  'alt',
  'label',
  'description',
  'summary',
  'caption',
  'heading',
  'reason',
  'text',
])

const LETTER = /\p{L}/u

/** Static text of a string or template literal, or null for anything else. */
function literalText(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map((s) => s.literal.text),
    ].join(' ')
  }
  return null
}

const isCopy = (text: string | null) =>
  text !== null &&
  LETTER.test(text) &&
  !/^(https?:|mailto:|\/)/.test(text.trim())

function findCopy(path: string, source: string) {
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const hits: Array<string> = []
  const report = (node: ts.Node, what: string) => {
    const { line } = file.getLineAndCharacterOfPosition(node.getStart())
    hits.push(`${path}:${line + 1} ${what}`)
  }
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && LETTER.test(node.text)) {
      report(node, `text ${JSON.stringify(node.text.trim())}`)
    } else if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) &&
      isCopy(literalText(node.expression))
    ) {
      report(node, `text ${node.expression.getText()}`)
    } else if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText()
      const init = node.initializer
      const value = ts.isJsxExpression(init) ? init.expression : init
      if (COPY_PROPS.has(name) && value && isCopy(literalText(value))) {
        report(node, `${name}=${value.getText()}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return hits
}

const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .map((f) => `src/${f.split('\\').join('/')}`)
  .filter((f) => f.endsWith('.tsx') && !SKIP.some((re) => re.test(f)))
  .sort()

it('finds JSX text and copy props, and ignores everything else', () => {
  const src = `
    const A = () => (
      <div className="flex gap-2" data-testid="x" key="k" aria-label="Close dialog">
        Hello
        <Icon name="search" />
        <a href="https://example.com" title={\`Open \${n}\`}>{' '}{'Inline'}{n}</a>
        <input placeholder={m.items.search()} />
      </div>
    )`
  expect(findCopy('a.tsx', src)).toEqual([
    'a.tsx:3 aria-label="Close dialog"',
    'a.tsx:4 text "Hello"',
    'a.tsx:6 title=`Open ${n}`',
    "a.tsx:6 text 'Inline'",
  ])
})

it('keeps user-facing copy out of components and routes', () => {
  const offenders = files.filter(
    (f) =>
      !ALLOWLIST.includes(f) && findCopy(f, readFileSync(f, 'utf8')).length > 0,
  )
  expect(
    offenders.flatMap((f) => findCopy(f, readFileSync(f, 'utf8'))),
  ).toEqual([])
})

it('lists only files that still hold copy', () => {
  const clean = ALLOWLIST.filter(
    (f) =>
      !files.includes(f) || findCopy(f, readFileSync(f, 'utf8')).length === 0,
  )
  expect(clean).toEqual([])
})
