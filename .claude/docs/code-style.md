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
  Data comes from route loaders and server fns, URL state from search params.
- Build UI from `#/components/ui` (shadcn) and the theme tokens in
  `src/styles.css`. No hard-coded colours; light and dark both have to work.
- Accessibility: inputs get visible labels (a placeholder alone is not
  enough), icon-only buttons get an `aria-label`, each page has one `h1`, and
  charts get a text or table alternative.
- Components are PascalCase functions in kebab-case files.
