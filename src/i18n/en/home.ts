import type { Catalog } from '../types'

export const home = {
  title: () => 'WoW Forever auction house prices',
  description: () =>
    'Daily World of Warcraft Forever auction house prices for EU and NA, with price history. Pricing data from TradeSkillMaster.',
  intro: () =>
    'Pick a region to see what items sell for today and how their prices changed over the last 90 days.',
  regionsLabel: () => 'Regions',
  regionCta: ({ region }: { region: string }) => `${region} market`,
  regionUnavailable: () => 'Not available yet',
  // follows the <Credit /> link: "Pricing data from TradeSkillMaster, imported once a day."
  creditTail: () => ', imported once a day.',
  howItWorks: () => 'How it works',
} satisfies Catalog
