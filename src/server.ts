import handler from '@tanstack/react-start/server-entry'
import { cachedFetch, dataVersion } from './server/edge-cache.ts'
import { runScheduled } from './server/ingest/jobs.ts'
import { withSecurityHeaders } from './server/security-headers.ts'
import { wwwRedirect } from './server/www-redirect.ts'

export default {
  fetch: async (request, env, ctx) =>
    withSecurityHeaders(
      wwwRedirect(request) ??
        (await cachedFetch(
          request,
          ctx,
          (canonical) => handler.fetch(canonical),
          () => dataVersion(env.DB),
        )),
    ),
  // awaited, not waitUntil: a rejection then marks the cron run as failed in the dashboard
  scheduled: async (controller, env) => {
    await runScheduled(controller, env)
  },
} satisfies ExportedHandler<Env>
