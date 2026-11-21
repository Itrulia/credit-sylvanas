# External services

## TSM public data

This is the only data source. The base URL is
`https://public-data.tradeskillmaster.com`: static CSVs on Cloudflare R2, with
no auth and no index or listing. The game type is `forever` and its regions
are `us`, `eu`, `kr` and `tw`. Forever has no pets or commodities files.

| File | Updates | Columns |
| --- | --- | --- |
| `forever/{region}/region/items.csv` | daily | `itemId,name,marketValue,historical,avgSalePrice,saleRate,soldPerDay,updatedAt` |
| `forever/{region}/realm/{realm}-{faction}/items.csv` (`alliance` or `horde`) | every few hours | `itemId,name,marketValue,minBuyout,recent,historical,updatedAt` |

- Prices are integer copper (1g = 100s = 10 000c).
- `updatedAt` is the same on every row of a file and equals the upstream scan
  time. Use it as the change key, but don't assume it is a plausible date: the
  realm fixture carries `1970-03-03T08:58:00Z`.
- Forever realm names are unknown. Realm ingest and UI run only off
  `src/config/realms.ts`, which ships empty. An empty list renders an honest
  empty state, never guessed realms. Don't probe the bucket for names.

### Terms (must follow)

1. Wherever data is shown, credit "Pricing data from TradeSkillMaster" with a
   link to https://tradeskillmaster.com.
2. Do not sell or republish the data in bulk: no CSV/JSON export and no bulk
   public API endpoints. Showing prices in the product is fine.
3. Do not present the site as TSM or as endorsed by TSM. Use no TSM logo or
   branding, and show a "not affiliated" note.
4. Download each file at most once per update. Only the ingest job fetches
   (daily, with `If-None-Match`/ETag). It skips storing when `updatedAt` is
   unchanged, and request handlers never fetch TSM.
5. The data is provided as is and its format may change. Validate the CSV
   header, fail loudly in ingest and keep the last good data.
6. Never fetch tradeskillmaster.com pages, because the site bans automated
   access. Fetch only from the public-data bucket and only in ingest code.
   This includes you: no WebFetch or curl of their site while researching.

## Wowhead

Links only: `https://www.wowhead.com/classic/item={itemId}`, opened as plain
external links. Don't scrape or fetch Wowhead.
