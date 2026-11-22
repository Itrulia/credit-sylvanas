# Testing

Vitest, with `vi.fn()` and `vi.mock()`. There is no Jest.

## Test-driven development is mandatory

Write the test, watch it fail on an assertion (not an import error),
implement the minimum, rerun, refactor. A bugfix test must reproduce the bug
first. Skip tests only for generated code, pure config and one-line copy or
style changes, and say so. Hard-to-test code means the logic belongs in a
pure function.

## Conventions

- Specs are `*.spec.ts` / `*.spec.tsx`, next to the source
  (`src/server/ingest/parse.ts` and `parse.spec.ts`).
- CSV parsing, price math (copper to g/s/c), snapshot upserts and zod schemas
  are the core. Test them hard, including malformed headers, empty files and
  an unchanged `updatedAt`.
- Use the fixtures in `src/server/__fixtures__/*.csv`, which are tiny real
  samples. Tests never hit the network. Stub `fetch` (`vi.stubGlobal`) and
  assert on the request (URL, `If-None-Match`); that is how the
  once-per-update rule stays tested.
- DB and ingest tests run on Miniflare D1 and R2 through
  `@cloudflare/vitest-plugin` ([DESIGN.md](../../docs/DESIGN.md) §3 Tests),
  never on the remote D1 or the dev DB in `.wrangler/`. History queries get a
  case with a 91-day-old row that must not come back.
- Freeze time with `vi.useFakeTimers({ toFake: ['Date'] })` and
  `vi.setSystemTime` when code stamps snapshot days, and assert UTC instants.
- Test server function logic as a plain function and keep the
  `createServerFn` wrapper thin.
- Test components only where logic lives (formatting, table and filter state,
  empty states). Query by role, label or text, never by CSS class.
