# Tech stack

Align suggestions with this stack unless asked otherwise. TanStack first:
before adding any dependency, check whether a TanStack library covers it
(Query, DB, Table, Form, Virtual, Pacer, Store, Hotkeys, Ranger) or the
Workers runtime does. Charts are the exception: recharts through the shadcn
`chart` component is the only charting library.

- TanStack Start (`@tanstack/react-start`) on Vite 8, React 19, strict
  TypeScript, pnpm. Everything is `.ts`/`.tsx`, config included; no
  hand-written `.js`.
- Cloudflare Workers through `@cloudflare/vite-plugin` and `wrangler.jsonc`
  (`main: "@tanstack/react-start/server-entry"`, `nodejs_compat`), on
  Workers Paid.
- Cloudflare D1 behind the binding `DB`, no ORM, async only
  (`prepare().bind().all()/first()/run()`, `batch()` for bulk writes).
  Cloudflare R2 bucket `credit-sylvanas-tsm-archive` behind `ARCHIVE`, private.
- TanStack Router (file-based, `src/routes`), Query with
  `@tanstack/react-router-ssr-query`, Table, Form, Pacer (debounce),
  Hotkeys (`useHotkey`); zod v4.
- Tailwind CSS 4, shadcn/ui (new-york, Radix). Dialogs are shadcn `Dialog`;
  cmdk is not used.
- Vitest 5, ESLint 9 (`@tanstack/eslint-config`), Prettier 3.

`@tanstack/*` and `recharts` are pinned to exact versions. Start 1.169.x
peers `vite >= 8`.

## Client data

All client reads go through TanStack Query. Each server fn file in
`src/server/fns/` exports a `queryOptions()` factory next to the fn. Loaders
`ensureQueryData` what the first HTML needs and `prefetchQuery` (no await)
for streamed sections; components read with `useSuspenseQuery` under
`<Suspense>`. `src/router.tsx` builds a `QueryClient` per request, puts it
in router context and calls `setupRouterSsrQueryIntegration`. Data changes
daily, so `staleTime` is long. Client-initiated reads (palette item search,
the About data log) reuse the same factories.

## Data, retention and schedule

D1 keeps one row per (region, itemId, snapshot day), plus every realm scan.
Nothing is ever deleted: no prune step, no `DELETE` in ingest. The UI never
shows more than 90 days and every history query clamps to the last 90 days
server-side. Every fetch attempt gets a row in `imports` (provenance:
source URL, R2 key, ETag, `updatedAt`, row count, SHA-256, status), and
snapshot rows point at it through `import_id`. Each new TSM file is also
gzipped into R2 under `forever/{region}/...{updatedAt}.csv.gz` and kept
forever, never served publicly. About shows a public data log of import
metadata only.

Schema changes are SQL files in `migrations/`, never DDL from app code. Paid
limits that shape the code: 10 GB per database, 50M rows written per month
included, 30 s CPU per invocation.

Ingest is the Worker's `scheduled` handler. A custom server entry exports
`{ fetch, scheduled }`, and Cron Triggers in `wrangler.jsonc` call it once a
day for region files and every 3 hours for realm files (only while
`src/config/realms.ts` has entries). Cron strings live in `wrangler.jsonc`
and [DESIGN.md](../../docs/DESIGN.md) §3.

## Dev only

`<TanStackDevtools>` in `__root.tsx` carries the Router, Query, Form, Pacer
and Hotkeys panels and renders only under `import.meta.env.DEV`. It must not
reach the production bundle; grep `dist/` after a build.

## Local dev

`pnpm dev` runs the Worker in Miniflare with local D1 and R2 under
`.wrangler/`. Apply migrations with
`pnpm exec wrangler d1 migrations apply DB --local`, then seed from CSVs on
disk (`pnpm db:seed`, files in `.seed/` named `forever_{region}_region_items.csv`),
then optionally `pnpm db:synth` for 89 days of fake history. Dev never
downloads TSM files. Build scripts for `workerd` and `sharp` are allowed in
`pnpm-workspace.yaml` (`allowBuilds`), which pnpm 12 reads instead of
`package.json`.

## Env, secrets and deploy

`.env` is committed and holds public values only. Secrets go in `.env.local`,
`.env.prod` or `.dev.vars`, all gitignored. Never run `wrangler login`,
`wrangler deploy` or any `--remote` command; the user does that.
