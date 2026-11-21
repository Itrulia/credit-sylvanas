# Tech stack

Align suggestions with this stack unless asked otherwise. Never add a
dependency for something the stack or the Node standard library covers.

- TanStack Start (`@tanstack/react-start`) on Vite 8 and Nitro 3 beta (node
  adapter), React 19, strict TypeScript, pnpm, Node >= 22.5.
- TanStack Router, file-based in `src/routes`; TanStack Table and TanStack
  Form; zod v4.
- Tailwind CSS 4 and shadcn/ui (new-york, Radix, lucide icons). Charts use
  recharts through the shadcn `chart` component.
- SQLite via `node:sqlite` (`DatabaseSync`), with no ORM and no native deps.
- Vitest 5, ESLint 9 (`@tanstack/eslint-config`), Prettier 3.

`@tanstack/*`, `nitro` and `recharts` are pinned to exact versions. Start
1.169.x peers `vite >= 8`, and nitro's only Vite 8 release is a beta. Since
`^3.0.0` does not match a `3.0.x-beta` under semver, keep nitro exact.

## Deploy

`pnpm build` produces a self-contained Nitro node server, started with
`node .output/server/index.mjs` (`PORT` sets the port). The DB lives outside
the build. Point `DATABASE_PATH` at a file on a persistent volume, or every
deploy starts empty. Ingest runs as a Nitro scheduled task inside that server
(and as `pnpm ingest` by hand). Run exactly one instance; with more, each
replica fetches TSM on its own and breaks the once-per-update rule.
