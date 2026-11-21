# Testing

Vitest, with `vi.fn()` and `vi.mock()`. There is no Jest.

## Test-driven development is mandatory

1. Write the test first. It describes the behaviour you are about to build.
2. Run it and confirm it fails for the right reason: an assertion mismatch,
   not a typo or an import error. A test that passes before the
   implementation exists tests nothing.
3. Implement the minimum that makes it pass, then run it again.
4. Refactor, re-running the test each time.

For a bugfix, the failing test must reproduce the reported bug. If you cannot
make it fail against the current code, you have not understood the bug yet.

You may skip tests only for generated code, pure config and one-line
styling or copy changes, and you must say that you skipped them and why. Code
that is hard to test is a design signal. Extract the logic into a pure
function instead of asserting nothing.

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
- For DB tests, open `new DatabaseSync(':memory:')` from `node:sqlite` per
  test and run the real schema on it. Never touch `./data/prices.db`.
- Freeze time with `vi.useFakeTimers({ toFake: ['Date'] })` and
  `vi.setSystemTime` when code stamps snapshot days, and assert UTC instants.
- Test server function logic as a plain function and keep the
  `createServerFn` wrapper thin.
- Test components only where logic lives (formatting, table and filter state,
  empty states). Query by role, label or text, never by CSS class.

Vitest uses `vitest.config.ts`, not the app's `vite.config.ts`; see
[gotchas.md](gotchas.md) for why.
