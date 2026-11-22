import type { Catalog } from '../types'

type Site = { site: string }

export const legal = {
  emailLabel: () => 'Email:',

  aboutHeadTitle: () => 'About and data sources',
  aboutHeadDescription: ({ site }: Site) =>
    `How ${site} gets its prices, what each number means and how often it updates.`,
  aboutTitle: () => 'About this site',
  aboutIntro: ({ site }: Site) =>
    `${site} shows what items sell for on the World of Warcraft Forever auction houses in the EU and NA regions. All prices are in gold, silver and copper.`,
  aboutNumbersTitle: () => 'What the numbers mean',
  aboutSourceTitle: () => 'Where the data comes from',
  aboutSourceFiles: () =>
    'Every price comes from the public data files that TradeSkillMaster publishes. Region prices update once a day. We download each file once per update.',
  aboutSourceHistory: () =>
    'We keep every daily snapshot, so price history grows from the day we started. Charts and tables show the last 90 days. The pages with prices, and the data log below, say when each update was scanned and imported.',
  aboutDataLogTitle: () => 'Data log',
  aboutDataLogText: () =>
    "Each time we fetch a price file, we log when it happened, which scan it held, how many rows it had and a short fingerprint of the file. A skipped row means the file hadn't changed since the last fetch.",
  aboutCreditTitle: () => 'Credit',
  aboutNoApiTitle: () => 'No API or downloads',
  aboutNoApiText: () =>
    "There's no API, export or download here, because TradeSkillMaster's terms don't allow republishing their data in bulk.",
  aboutPrivacyTitle: () => 'Privacy',
  aboutPrivacyText: () =>
    "No accounts and no cookies. We host every font ourselves. Your last region, the items you viewed recently and your favourites stay in your browser's local storage and are never sent anywhere. Three outside services are involved:",
  aboutPrivacyCloudflare: () =>
    'Cloudflare hosts the site. Its servers see your IP address when you load a page, and our request and error logs are deleted after 7 days.',
  aboutPrivacyUmami: () =>
    'Umami counts page views and a few actions from its EU servers, without cookies and without storing IP addresses. It never gets your search terms, and it counts nothing if your browser sends Do Not Track.',
  aboutPrivacyWowhead: () =>
    "Wowhead's tooltip script adds item icons and tooltips. It loads on every price page, but not on this page, the home page or the legal pages.",
  aboutPrivacyMoreLead: () => 'The',
  aboutPrivacyMoreLink: () => 'privacy notice',
  aboutPrivacyMoreTail: () => 'has the details and your rights.',

  dataLogFetched: () => 'Fetched',
  dataLogScan: () => 'TSM scan',
  dataLogRegion: () => 'Region',
  dataLogRegionRealm: ({ region, realm }: { region: string; realm: string }) =>
    `${region} · ${realm}`,
  dataLogRows: () => 'Rows',
  dataLogStatus: () => 'Status',
  dataLogReason: () => 'Reason',
  dataLogFingerprint: () => 'Fingerprint',
  dataLogStatusImported: () => 'Imported',
  dataLogStatusSkipped: () => 'Skipped',
  dataLogStatusFailed: () => 'Failed',
  dataLogLoading: () => 'Loading the data log…',
  dataLogEmptyTitle: () => 'No imports yet.',
  dataLogEmptyText: () => "The first daily price update hasn't run.",
  dataLogCaption: () => 'Recent price imports',

  impressumHeadTitle: () => 'Impressum',
  impressumHeadDescription: ({ site }: Site) =>
    `Who runs ${site}, how to reach us, and the trademark and link notes.`,
  impressumTitle: () => 'Impressum',
  impressumIntro: ({ site }: Site) =>
    `${site} is a non-commercial fan project. It has no paid features and no ads.`,
  impressumOperatorTitle: () => 'Operator',
  impressumOperator: ({ site }: Site) =>
    `${site}, a non-commercial fan project.`,
  impressumSourceTitle: () => 'Data source',
  impressumSourceText: () =>
    "TradeSkillMaster publishes the files we read. We don't change the prices, but we can't promise they are complete or current.",
  impressumNotAffiliatedTitle: () => 'Not affiliated',
  impressumNotAffiliatedText: ({ site }: Site) =>
    `${site} is not affiliated with or endorsed by TradeSkillMaster, Blizzard Entertainment or Wowhead.`,
  impressumTrademarksTitle: () => 'Trademarks',
  impressumTrademarksText: () =>
    'World of Warcraft and Blizzard Entertainment are trademarks or registered trademarks of Blizzard Entertainment, Inc. Other names belong to their owners.',
  impressumLinksTitle: () => 'Links to other sites',
  impressumLinksText: () =>
    'We link to TradeSkillMaster and Wowhead. Their owners are responsible for what those pages say. If we learn that a page we link to breaks the law, we remove the link.',

  privacyHeadTitle: () => 'Privacy',
  privacyHeadDescription: ({ site }: Site) =>
    `What ${site} and the services it uses learn about you, and your rights under Swiss data protection law.`,
  privacyTitle: () => 'Privacy',
  privacyIntro: ({ site, reviewed }: { site: string; reviewed: string }) =>
    `${site} has no accounts, sets no cookies and never asks for your name. Your browser keeps the last region you opened, the last three items you viewed and the items you starred as favourites in its local storage, so pages without a region open on it and the search lists those items. That stays on your device and is never sent to us or anyone else. This notice follows the Swiss Federal Act on Data Protection (FADP). Last updated ${reviewed}.`,
  privacyResponsibleTitle: () => 'Who is responsible',
  privacyResponsibleLead: ({ site }: Site) =>
    `${site}, a non-commercial fan project (see the`,
  privacyResponsibleLink: () => 'Impressum',
  privacyResponsibleTail: () => ').',
  privacyHostingTitle: () => 'Hosting: Cloudflare',
  privacyHostingText: () =>
    "Cloudflare, Inc. hosts the site and delivers every page. To do that and to block attacks, its servers process your IP address, the page you ask for, your browser's user agent and the time. Cloudflare is a US company and may process this data outside Switzerland, including in the USA.",
  privacyHostingLogs: () =>
    'Our server logs record requests and errors so we can fix problems. Cloudflare deletes them after 7 days.',
  privacyStatsTitle: () => 'Visitor statistics: Umami',
  privacyStatsText: () =>
    'Umami Cloud counts page views from servers in the EU. It also counts a few actions, such as switching region, sorting a table or opening an item, so we can see which features people use.',
  privacyStatsDetails: () =>
    "Umami sets no cookies and doesn't store your IP address. We never send it what you type into search, and the query part of a page address is left out. If your browser sends Do Not Track, nothing is counted. The counts are anonymous, and we keep them for as long as the site runs.",
  privacyTooltipsTitle: () => 'Item tooltips: Wowhead',
  privacyTooltipsText: () =>
    "Every page except the home page, About, the Impressum and this one loads Wowhead's tooltip script from wow.zamimg.com to show item icons and tooltips. Your browser then connects to Wowhead, which sees your IP address and the page you are on. Wowhead's own privacy policy covers that data.",
  privacyFontsTitle: () => 'Fonts',
  privacyFontsText: () =>
    'We host every font ourselves, so your browser never contacts Google or another font service.',
  privacyPurposeTitle: () => 'Why we process data',
  privacyPurposeText: () =>
    "To deliver the site, keep it secure and running, and see which pages and features get used. We don't sell data, show ads or build profiles of visitors.",
  privacyRightsTitle: () => 'Your rights',
  privacyRightsText: () =>
    'You can ask what data about you we hold, and ask us to correct or delete it. We hold almost nothing that identifies a person, but we will check and answer. Write to the email address above.',
  privacyRightsComplaint: () =>
    'You can also complain to the Federal Data Protection and Information Commissioner (FDPIC).',
} satisfies Catalog
