import handler from '@tanstack/react-start/server-entry'
import { cachedFetch } from './server/edge-cache.ts'
import { runScheduled } from './server/ingest/jobs.ts'
import { wwwRedirect } from './server/www-redirect.ts'

export default {
  fetch: (request, _env, ctx) =>
    wwwRedirect(request) ??
    cachedFetch(request, ctx, () => handler.fetch(request)),
  // awaited, not waitUntil: a rejection then marks the cron run as failed in the dashboard
  scheduled: async (controller, env) => {
    await runScheduled(controller, env.DB, env.ARCHIVE)
  },
} satisfies ExportedHandler<Env>
