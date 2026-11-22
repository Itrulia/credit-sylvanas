import type { Catalog } from '../types'

export const realms = {
  headTitle: ({ region }: { region: string }) =>
    `Realms · ${region} Forever AH`,
  headDescription: ({ region }: { region: string }) =>
    `Pick a ${region} Forever realm to see realm prices.`,
  pageTitle: ({ region }: { region: string }) => `${region} realms`,
  rulesetLabel: () => 'Ruleset',

  rulesetAll: () => 'All',
  rulesetNormal: () => 'Normal',
  rulesetPvp: () => 'PvP',
  rulesetRp: () => 'RP',
  rulesetRpPvp: () => 'RP-PvP',
  factionAlliance: () => 'Alliance',
  factionHorde: () => 'Horde',

  emptyTitle: () => 'No realms on the books yet.',
  emptyBody: ({ region }: { region: string }) =>
    `TSM publishes no Forever realm list, so we add realms by hand. Region prices cover every realm in ${region}.`,
  emptyMarketLink: ({ region }: { region: string }) => `Go to ${region} market`,
  filteredEmptyTitle: ({
    ruleset,
    region,
  }: {
    ruleset: string
    region: string
  }) => `No ${ruleset} realms added for ${region}.`,
  filteredEmptyShowAll: () => 'Show all realm types',
  listLabel: ({ region }: { region: string }) => `${region} realms`,
  factionLinkLabel: ({ realm, faction }: { realm: string; faction: string }) =>
    `${realm} ${faction}`,
} satisfies Catalog
