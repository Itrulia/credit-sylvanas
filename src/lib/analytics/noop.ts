import type { AnalyticsProvider } from './index'

/** Dev, tests and builds without a website id. */
export const noopProvider: AnalyticsProvider = {
  track: () => undefined,
  pageview: () => undefined,
}
