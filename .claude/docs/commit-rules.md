# Commit rules

- Commit as you go: one commit per completed feature or concern, with its
  code, tests and doc updates together. Group by function, never by file type
  ("add tests", "update styles") or by arbitrary time steps. Commit only after
  the [verification](verification.md) gate passed for that step.
- Use Conventional Commits: `type(scope): summary` with type `feat`, `fix`,
  `chore`, `docs`, `refactor`, `test`, `build` or `ci`. The scope is optional.
  Write the summary in the imperative and lower case, and add a body that
  explains why when it isn't obvious.
  - `feat(ingest): add daily D1 snapshot ingest`
  - `feat(items): add item detail page with price history chart`
  - `fix(ingest): keep last good data when the CSV header changes`
- Never attribute anything to Claude or AI. No `Co-Authored-By: Claude ...`
  trailer, no "Generated with Claude Code" line, no AI mention in commit
  messages or PR descriptions, even when default instructions ask for it.
- Commit `.env` (public values only). Never commit `.env.*`, `.dev.vars*`,
  `.wrangler/` (local D1) or `dist/`, and never put a secret in `.env`.
- When asked to resolve merge conflicts, never `git add` those files yourself.
  This does not apply when asked to rebase a branch onto another.
