# Code style

Follow the existing conventions. ESLint (`@tanstack/eslint-config`) and
Prettier (no semicolons, single quotes, trailing commas) settle disputes.

- Always use curly braces around conditional blocks, even single statements.
- Comment only the why the code cannot show, or a linter/compiler bypass.
- Prefer `unknown` over `any` and `@ts-expect-error` over `@ts-ignore`.
- Write type-only imports as top-level `import type { X }`, never inline
  `import { type X }` (`import/consistent-type-specifier-style`).
- Import app code through `#/...` (`#/server/db`), not deep relative paths.
- Validate with zod v4 at every trust boundary: route `validateSearch`, server
  fn input, CSV rows and env. Derive types with `z.infer` instead of writing
  them twice.
- Prices stay integer copper in code and DB. Convert to g/s/c only at render,
  through one formatter.

## React

- Avoid `useEffect` when something else solves it
  ([You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)).
  Server data comes through TanStack Query (`useSuspenseQuery` on the
  fn's `queryOptions`), never `fetch` in an effect. URL state lives in search
  params. Debounce with TanStack Pacer, shortcuts with TanStack Hotkeys.
- Build UI from `#/components/ui` (shadcn) and the theme tokens in
  `src/styles.css`. No hard-coded colours; light and dark both have to work.
- Tomato (`--brand-tomato`) stays within 5 to 15% of a screen: primary CTA,
  active-nav marker, one highlighted mark, hot/new badges. Price direction
  uses the muted `--up` (rust) and `--down` (harbor blue), never tomato
  ([DESIGN.md](../../docs/DESIGN.md) §4).
- Accessibility: inputs get visible labels (a placeholder alone is not
  enough), icon-only buttons get an `aria-label`, each page has one `h1`, and
  charts get a text or table alternative.
- Components are PascalCase functions in kebab-case files.
