# Gotchas and load-bearing constraints

Things that look like cleanup opportunities and aren't, plus failures that
cost real time. Read this before "simplifying" config, the server boundary or
ingest. When a subtle failure costs you time, add an entry using the template
at the bottom.

### Vitest has its own `vitest.config.ts` on purpose

Don't merge it back into `vite.config.ts`. Under the app config, vitest loads
the devtools, nitro and tanstackStart plugins and dies with
`ReferenceError: module is not defined` at `react/index.js`, leaving Vite
servers hanging. The separate config keeps only `resolve.tsconfigPaths`,
`environment: 'node'` and `passWithNoTests`. Component specs that need a DOM
set `// @vitest-environment jsdom` per file (install jsdom first).

### ESLint ignores `.output/`, `routeTree.gen.ts` and `src/components/ui/`

Without the ignores, a stale build gets linted and the shadcn components fail
`import/consistent-type-specifier-style`. The ui folder is CLI-managed vendored
code, so it stays out of lint instead of the rule being disabled repo-wide.

### Vite regenerates `routeTree.gen.ts`

The router plugin rewrites `src/routeTree.gen.ts` on every `pnpm dev` and
`pnpm build`, so hand edits are lost. A missing or renamed route that shows up
as a type error means the tree is stale. Run `pnpm build` instead of editing.

### A 404 from the TSM bucket is normal

The bucket has no index, so an unknown realm slug or region answers 404. Treat
404 as "no such file": log it, skip it and keep the last good data. Never
discover realms by probing names.

### tradeskillmaster.com bans automated access

Only `public-data.tradeskillmaster.com` may be fetched, and only by ingest.
Fetching their website (docs, realm pages, tooltips) from code or while
researching risks a ban for the deploy's IP.

### `node:sqlite` needs Node >= 22.5

`DatabaseSync` is built in from 22.5, and the experimental warning on 22.x is
expected. Older Node fails with `No such built-in module: node:sqlite`. Don't
switch to `better-sqlite3` to work around it; avoiding native deps is the
reason for `node:sqlite`.

### Server-only code reaches the client bundle unless the boundary is literal

The Start plugin strips server code by removing `createServerFn` handlers and
the literal `server: { handlers: {...} }` property of `createFileRoute`. A
handler built by a factory, or a top-level import of `#/server/db` in a route
file that the component also uses, ships to the browser and fails the build
with `"..." is not exported by "__vite-browser-external"`. Spell the block out
and call a shared function inside it.

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
- Nitro bakes a build-time glob of `.output/public` into the server, so files
  copied in after `pnpm build` are never served. Put static files in
  `public/` before building.
- `new URL('./x', import.meta.url)` for assets turns into a `file://` path
  under SSR. Import the asset so Vite rewrites the URL.
- A green build can still ship a broken `.output`. Rolldown may emit a literal
  `__require("react")` inside an inlined CJS dependency, which fails at runtime
  with `Cannot find module 'react'` because `.output` has no `node_modules`.
  After adding a dependency that renders on the server, boot
  `node .output/server/index.mjs` and curl a page. The fix is a
  `resolve.alias` to the package's ESM build. Adding `react` to nitro
  `traceDeps` or `ssr.noExternal` loads a second React copy and leaves SSR
  empty or broken.
- nitro 3 renamed `externals.external` to `traceDeps`, and it silently
  ignores the old key.

## Adding an entry

```markdown
### <one-line claim, present tense>

<What the code does now, with a file link.> <What failed, with concrete
evidence: the error string, the measured number, the date verified.> <Why the
obvious alternative cannot work.>

Load-bearing: <which lines must not be removed, and what happens if they
are.> Pinned by `<spec>`, or "Nothing guards this."
```

Delete an entry once the constraint is gone. A stale gotcha makes readers
distrust the whole file.
