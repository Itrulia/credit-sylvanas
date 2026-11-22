import type {
  HeatMetric,
  HeatSort,
  ItemSort,
  Region,
  StatRange,
} from '#/lib/search'
import { SITE_URL } from '#/lib/seo'
import { noopProvider } from './noop'
import { umamiProvider } from './umami'

/** The closed list of events. No personal data and no free text, ever. */
export interface AnalyticsEvents {
  palette_open: undefined
  /** the visible group label, never the query */
  palette_select: { group: string }
  region_switch: { region: Region }
  item_view: { itemId: number; region: Region }
  stats_range_change: {
    card: 'mv' | 'cmp' | 'heat' | 'sales'
    range: StatRange
  }
  heatmap_metric_change: { metric: HeatMetric }
  table_sort: { column: ItemSort | HeatSort }
  outbound_wowhead: { itemId: number }
  error_page: { status: 404 | 500 }
}

export type AnalyticsEvent = keyof AnalyticsEvents

type PropsArg<TEvent extends AnalyticsEvent> =
  AnalyticsEvents[TEvent] extends undefined
    ? []
    : [props: AnalyticsEvents[TEvent]]

/** What a provider implements. Swapping provider is one file plus one line below. */
export interface AnalyticsProvider {
  track: (event: string, props?: Record<string, string | number>) => void
  /** the current location, called after each client navigation */
  pageview: () => void
}

export function createAnalytics(provider: AnalyticsProvider) {
  return {
    track: <TEvent extends AnalyticsEvent>(
      event: TEvent,
      ...[props]: PropsArg<TEvent>
    ) => provider.track(event, props),
    trackPageview: () => provider.pageview(),
  }
}

const websiteId: string | undefined = import.meta.env.VITE_UMAMI_WEBSITE_ID

// production builds only; Umami's data-domains also keeps previews quiet
export const { track, trackPageview } = createAnalytics(
  import.meta.env.PROD && websiteId
    ? umamiProvider({ websiteId, domain: new URL(SITE_URL).host })
    : noopProvider,
)
