# Worgen of Booty Bay

Public, login-free price site for World of Warcraft "Forever" auction houses,
built on TradeSkillMaster (TSM) public CSV data. It is one TanStack Start app
(React 19, Vite 8, Nitro node adapter) with SQLite through built-in
`node:sqlite` and a daily ingest job. [docs/CONTEXT.md](docs/CONTEXT.md) is the
ground truth for the data source, TSM terms and architecture decisions. Read it
before touching ingest, storage or anything that shows prices. If it disagrees
with these docs, it wins and the doc gets fixed.

## Non-negotiables

1. Test-driven development. Write the test first, run it, watch it fail for
   the right reason, then implement. Never write implementation before a
   failing test exists. See [testing.md](.claude/docs/testing.md).
2. Verify before claiming done. Run `pnpm test`, `pnpm typecheck` and
   `pnpm lint` (plus `pnpm build` when you touched routes, server code or
   config) and read the output. Never say "done", "fixed" or "tests pass"
   without having run the command in this session. See
   [verification.md](.claude/docs/verification.md).
3. Commit each completed feature or concern as a Conventional Commit
   (`feat(ingest): ...`) once its gate passed. Group by function, not by file
   type or time step. Never attribute anything to Claude or AI: no
   `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line, no
   AI mention in commits or PR descriptions. See
   [commit-rules.md](.claude/docs/commit-rules.md).
4. Never write plan files. Plans, brainstorms, checklists and progress notes
   belong in the conversation, including anything an agent skill would write
   to `docs/plans/`, `.plans/`, `specs/` or `thoughts/`. Scratch files go in a
   temp directory, never the working tree.
5. Never edit generated code. The router plugin regenerates
   `src/routeTree.gen.ts` on `pnpm dev` and `pnpm build`. Add or update the
   shadcn components in `src/components/ui` with
   `pnpm dlx shadcn@latest add <name>` and compose or wrap them elsewhere.
   Hand-edit one only when that file is genuinely the right place for the fix.
6. Follow the TSM terms ([external-services.md](.claude/docs/external-services.md)).
   Credit "Pricing data from TradeSkillMaster" wherever data is shown. Offer
   no bulk export or feed (no CSV/JSON download, no public bulk API). Fetch
   each file at most once per update, only from the ingest job, never from a
   request handler. Never fetch tradeskillmaster.com pages, only
   `public-data.tradeskillmaster.com`. That rule covers you as well: do not
   WebFetch or curl their site while working.
7. Check [gotchas.md](.claude/docs/gotchas.md) before "simplifying" config,
   the server/client boundary or ingest safeguards.
8. Keep these docs current. After landing a change, update the relevant file
   when it adds or removes a route, table, command, env var, integration or
   convention, or when it makes something written here wrong. Skip routine bug
   fixes, refactors that keep the shape, dependency bumps and copy/UI tweaks.
   The test: would the next agent be misled by the current text? If yes, fix
   it in the same change. If you burned real time on a subtle failure, add a
   [gotchas.md](.claude/docs/gotchas.md) entry so nobody repeats it.
9. Run every piece of prose written for humans through the `humanizer` skill
   before finalizing: UI copy, docs, README, commit messages, PR descriptions
   and replies. Strip AI tells such as not-X-but-Y contrasts, forced triads,
   dash overuse, stock AI words, sales language and bold-label lists.

## Detailed guidance

Every file below loads into every session, so keep the whole set around
20 KB. A doc earns its place by changing what an agent does. Prose restating
what a competent reader knows about React, TanStack or SQLite does not. Prefer
editing an existing file over adding one. When a fact would land in two files,
put it in one and link to it, because duplicated facts drift.

@.claude/docs/repo-map.md
@.claude/docs/tech-stack.md
@.claude/docs/testing.md
@.claude/docs/verification.md
@.claude/docs/gotchas.md
@.claude/docs/code-style.md
@.claude/docs/external-services.md
@.claude/docs/commit-rules.md
