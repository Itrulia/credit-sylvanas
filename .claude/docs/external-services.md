# External services

## TSM public data

This is the only data source. The base URL is
`https://public-data.tradeskillmaster.com`: static CSVs on Cloudflare R2, with
no auth and no index or listing. The game type is `forever` and its regions
are `us`, `eu`, `kr` and `tw`. Forever has no pets or commodities files.

| File                                                                         | Updates         | Columns                                                                         |
| ---------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `forever/{region}/region/items.csv`                                          | daily           | `itemId,name,marketValue,historical,avgSalePrice,saleRate,soldPerDay,updatedAt` |
| `forever/{region}/realm/{realm}-{faction}/items.csv` (`alliance` or `horde`) | every few hours | `itemId,name,marketValue,minBuyout,recent,historical,updatedAt`                 |

- Prices are integer copper (1g = 100s = 10 000c).
- `updatedAt` is the same on every row of a file and equals the upstream scan
  time. Use it as the change key, but don't assume it is a plausible date: the
  realm fixture carries `1970-03-03T08:58:00Z`.
- Forever realm names are unknown. Realm ingest and UI run only off
  `src/config/realms.ts`, which ships empty. An empty list renders an honest
  empty state, never guessed realms. Don't probe the bucket for names.

### Terms (must follow)

1. Credit "Pricing data from TradeSkillMaster" (linking
   https://tradeskillmaster.com) wherever data is shown.
2. No bulk republishing: no CSV/JSON export, no bulk public API, no public
   access to the R2 archive. Showing prices in the product is fine.
3. No TSM logo or branding, and a "not affiliated" note.
4. Each file at most once per update: only the scheduled ingest fetches,
   with `If-None-Match`/ETag, and skips storing an unchanged `updatedAt`.
   Request handlers and local dev never fetch TSM.
5. The format may change: validate the CSV header, fail loudly, keep the
   last good data.
6. Never fetch tradeskillmaster.com pages (they ban automated access).

## Wowhead

Wowhead Forever tooltips, client-side only and as progressive enhancement:
`window.whTooltips = {colorLinks: false, iconizeLinks: true, renameLinks: false, iconSize: 'small'}`
plus `https://wow.zamimg.com/js/tooltips.js`. Links are
`<a href="https://www.wowhead.com/forever/item={id}" data-wowhead="item={id}&domain=forever">`.
Item links get `data-wowhead` from the `tagForWowhead` ref (`src/lib/wowhead.ts`)
after React mounts them, never in server HTML (see gotchas), and the ref queues
one rescan per frame. After client navigation call `WH.Tooltips.refreshLinks()`
behind a guard (it is undocumented). Layout and names never depend on the script.
The script prepends `span.iconsmall > ins + del` to each link: `ins` is the
icon picture, `del` Wowhead's thick frame. `src/styles.css` hides the `del`
and draws a 1px edge with unlayered `a[data-wowhead] .iconsmall` rules
(Tailwind layers lose to Wowhead's unlayered CSS). That markup comes from
reading `tooltips.js` on 2026-11-22 and is undocumented, so recheck it if the
frame comes back. So names don't shift when the icon lands, an unlayered
`::before` box of the same size holds its place from first paint on
`a[data-wowhead]` and on `a[data-item-link]` (item links, untagged until
hydration). It hides once the link has `.iconsmall`, and on every link while
`<html data-wowhead="off">` is set, which `components/wowhead-tooltips.tsx` does
on pages that don't load the script, on `onerror`, and when `window.WH` is still
missing 10 s after insertion. Links with `data-wh-icon-added` or
`data-wh-icon-size` get no box. Never scrape
or fetch Wowhead server-side; it answers bots with 403.
