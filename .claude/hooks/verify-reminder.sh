#!/usr/bin/env bash
# Stop hook: if source files changed but verification was never run, remind
# Claude to run it. Fires at most ONCE per session (marker file) so it can
# never trap the model in a stop/retry loop.
set -uo pipefail

input=$(cat 2>/dev/null || echo '{}')
session=$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

# -uall lists files inside new untracked directories, not just the directory.
changed=$(git status --porcelain --untracked-files=all -- src scripts 2>/dev/null \
  | grep -E '\.(ts|tsx|js|jsx)$' | grep -v 'routeTree\.gen\.ts$' || true)
[ -z "$changed" ] && exit 0

marker="${TMPDIR:-/tmp}/claude-verify-${session}"
[ -f "$marker" ] && exit 0
: > "$marker"

cmd='pnpm test && pnpm typecheck && pnpm lint (plus pnpm build if you touched routes, src/server or config)'
count=$(printf '%s\n' "$changed" | wc -l | tr -d ' ')

jq -nc --arg cmd "$cmd" --arg count "$count" '{
  decision: "block",
  reason: ("Verification gate: \($count) source file(s) under src/ or scripts/ have uncommitted changes. Before finishing, run: \($cmd) — then report the actual result. If you already ran it this turn, or the changes are not yours to verify, say so in one line and stop; this reminder does not fire again in this session.")
}'
