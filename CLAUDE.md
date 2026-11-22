# Credit Sylvanas

Public, login-free price site for World of Warcraft "Forever" auction houses,
built on TradeSkillMaster (TSM) public CSV data. It is one TanStack Start app
(React 19, Vite 8) on Cloudflare Workers, with Cloudflare D1 for storage and
Cron Triggers for ingest. [docs/CONTEXT.md](docs/CONTEXT.md) is the
ground truth for the data source, TSM terms and architecture decisions. Read it
before touching ingest, storage or anything that shows prices. If it disagrees
with these docs, it wins and the doc gets fixed.

## Non-negotiables

1. TDD with Vitest: a failing test before any implementation
   ([testing.md](.claude/docs/testing.md)).
2. Never claim done without running the gate in this session and reading
   the output ([verification.md](.claude/docs/verification.md)).
3. One Conventional Commit per finished feature or concern, after its gate
   passed. Never any Claude or AI attribution, no `Co-Authored-By` trailer
   ([commit-rules.md](.claude/docs/commit-rules.md)).
4. Never write or commit plan files. `docs/CONTEXT.md` and `docs/DESIGN.md`
   are untracked plans: read them, never commit them. Scratch files go in a
   temp directory.
5. Never edit `src/routeTree.gen.ts`. Add shadcn components with
   `pnpm dlx shadcn@latest add <name>` and hand-edit one only when it is
   genuinely the right place (DESIGN §4 lists the planned edits).
6. Follow the TSM terms in
   [external-services.md](.claude/docs/external-services.md). They bind you
   too: never WebFetch or curl tradeskillmaster.com, and never download TSM
   CSVs while developing. Local data comes from CSVs already on disk.
7. Check [gotchas.md](.claude/docs/gotchas.md) before "simplifying" config,
   the server/client boundary or ingest safeguards.
8. Keep these docs current. If a change would mislead the next agent
   reading them (a route, table, command, env var, integration or convention
   added, removed or changed), fix the doc in the same commit. If a subtle
   failure cost you real time, add a [gotchas.md](.claude/docs/gotchas.md)
   entry.
9. Run prose for humans (UI copy, docs, commit messages, PR descriptions)
   through the `humanizer` skill: no em dashes, no AI tells.

## Detailed guidance

Every file below loads into every session, so keep the set around 20 KB.
A line earns its place by changing what an agent does. Put each fact in one
file and link to it.

@.claude/docs/repo-map.md
@.claude/docs/tech-stack.md
@.claude/docs/testing.md
@.claude/docs/verification.md
@.claude/docs/gotchas.md
@.claude/docs/code-style.md
@.claude/docs/external-services.md
@.claude/docs/commit-rules.md
