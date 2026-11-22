# Gotchas and load-bearing constraints

Things that look like cleanup and aren't, plus failures that cost real
time. Add entries with the template at the bottom.

### Vitest has its own `vitest.config.ts` on purpose

Don't merge it back into `vite.config.ts`. Under the app config, vitest loads
the devtools, runtime and tanstackStart plugins, which crashed it with
`ReferenceError: module is not defined` at `react/index.js` and left Vite
servers hanging. The Cloudflare plugin stays out for the same reason.
The separate config keeps only `resolve.tsconfigPaths`,
`environment: 'node'` and `passWithNoTests`. Component specs that need a DOM
set `// @vitest-environment jsdom` per file (install jsdom first).

### ESLint ignores build output, `routeTree.gen.ts` and `src/components/ui/`

The build lands in `dist/` and Miniflare state in `.wrangler/`. Without the
ignores a stale build gets linted, and the CLI-managed shadcn files fail
`import/consistent-type-specifier-style`, so the folder is ignored instead of
the rule being disabled repo-wide.

### `eslint.config.ts` needs `jiti` as a direct devDependency

ESLint 9 loads a TS config through `jiti`. pnpm only hoists it today because
another package depends on it, so keep it in `devDependencies` or lint breaks
on the next install. Prettier loads `prettier.config.ts` through Node 22's
type stripping and needs nothing extra.

### Vite regenerates `routeTree.gen.ts`

The router plugin rewrites `src/routeTree.gen.ts` on every `pnpm dev` and
`pnpm build`, so hand edits are lost. A missing or renamed route that shows up
as a type error means the tree is stale. Run `pnpm build` instead of editing.

### A 404 from the TSM bucket is normal

The bucket has no index, so an unknown file answers 404. Record it as a
`failed` import, keep the last good data, and never probe for realm names.

### Server-only code reaches the client bundle unless the boundary is literal

The Start plugin strips server code by removing `createServerFn` handlers and
the literal `server: { handlers: {...} }` property of `createFileRoute`. A
handler built by a factory, or a top-level import of `#/server/db` in a route
file that the component also uses, ships to the browser and fails the build
with `"..." is not exported by "__vite-browser-external"`. Spell the block out
and call a shared function inside it.

### D1 is async and bindings exist per request

Every D1 call returns a promise. `DB` and `ARCHIVE` come from the Worker env
(`cloudflare:workers` in `src/server/db/client.ts`, or the argument passed to
ingest), never from a singleton opened at import time. Ingest writes through
`db.batch()`, because a round trip per row runs past the 30 s CPU limit, and
skips unchanged files to stay inside the 50M monthly row writes.

### Migrations are append-only

`wrangler d1 migrations apply` records applied file names. Editing a file that
already ran does nothing on that database and leaves local and remote schemas
different. Add a new numbered file instead and apply it `--local`; the user
applies `--remote` before deploying.

### Router and Start traps

These come from a production TanStack Start migration in another repo.

- A `.default()` in `validateSearch` causes a 307 on first load, because the
  router canonicalises the URL. Keep the schema free of defaults and apply
  them when reading.
- The 404 status comes from `throw notFound()` in the loader. Rendering a
  "not found" UI without throwing answers 200.
- React 19 hoists `<title>` but does not dedupe, and the first one wins. Set
  the title in exactly one place per route (`head()`), with no default in the
  shell.
- Inline scripts in `head().scripts` re-run on every client navigation. Use
  `ScriptOnce` from `@tanstack/react-router` for one-shot bootstraps such as
  the theme snippet that runs before paint.
- `new URL('./x', import.meta.url)` for assets turns into a `file://` path
  under SSR. Import the asset so Vite rewrites the URL.

## Adding an entry

```markdown
### <one-line claim, present tense>

<What the code does now, with a file link.> <What failed, with concrete
evidence: the error string, the measured number, the date verified.> <Why the
obvious alternative cannot work.>

Load-bearing: <which lines must not be removed, and what happens if they
are.> Pinned by `<spec>`, or "Nothing guards this."
```

Delete an entry once the constraint is gone.
