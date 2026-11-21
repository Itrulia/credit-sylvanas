# Verification

Evidence comes before assertions. Never say "done", "fixed", "working" or
"tests pass" without having run the command and read its output in this
session. If you did not run it, say so: "I have not run the build."

## The gate

```bash
pnpm test        # vitest run
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm build       # vite build -> .output/
```

Run the first three for every code change. Add `pnpm build` when you touched
routes, anything under `src/server`, `vite.config.ts` or dependencies. Only
the build catches server-only code leaking into the client bundle or a stale
`routeTree.gen.ts`. While iterating, use `pnpm vitest run <path>`, or
`pnpm vitest <path>` to watch.

Formatting: `pnpm check` reports and `pnpm format` rewrites the whole repo.
Prefer `pnpm exec prettier --write <files you touched>` so the diff stays yours.

Never start `pnpm dev` or `pnpm preview` to see whether something works when a
test or the build answers the question. If you need the running app, start it
in the background, say what you are looking for, and stop it afterwards.

## Reporting results

State the actual outcome:

- `pnpm test`: 12 files, all passed
- 2 tests fail in `src/server/ingest/parse.spec.ts` (paste the assertion)
- `pnpm build` not run; the change was test-only

If a test fails, say so and show the output. Never make it green by loosening
the assertion or deleting the case. Diagnose the cause first.
