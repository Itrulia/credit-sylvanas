# Verification

Never say "done", "fixed" or "tests pass" without having run the command
and read its output in this session. If you did not run it, say so.

## The gate

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```

Run all four before claiming a step done. Only the build catches server-only
code leaking into the client bundle, devtools reaching production, or a stale
`routeTree.gen.ts`. While iterating, use `pnpm vitest run <path>`.

Format only what you touched: `pnpm exec prettier --write <files>`.

Don't start `pnpm dev` when a test or the build answers the question. If you
need the running app, start it in the background and stop it afterwards.

## Reporting results

Report real output ("`pnpm test`: 12 files, all passed", or the failing
assertion). Never make a test green by loosening or deleting it; find the
cause.
