import handler from '@tanstack/react-start/server-entry'
import { cachedFetch, dataVersion } from './server/edge-cache.ts'
import { runScheduled } from './server/ingest/jobs.ts'
import { wwwRedirect } from './server/www-redirect.ts'

export default {
  fetch: (request, env, ctx) =>
    wwwRedirect(request) ??
    cachedFetch(
      request,
      ctx,
      () => handler.fetch(request),
      () => dataVersion(env.DB),
    ),
  // awaited, not waitUntil: a rejection then marks the cron run as failed in the dashboard
  scheduled: async (controller, env) => {
    await runScheduled(controller, env)
  },
} satisfies ExportedHandler<Env>
