import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { m } from '#/i18n'
import type { Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import { CommandPaletteTrigger } from './command-palette/command-palette-trigger'
import { useCommandPalette } from './command-palette/command-palette-provider'
import { Icon } from './icon'
import { RegionNav } from './region-nav'
import { useCurrentRegion, useRegion } from './search/site-commands'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'

const NAV = [
  { label: m.shell.navMarket, to: '/$region' },
  { label: m.shell.navItems, to: '/$region/items' },
  { label: m.shell.navHeatmaps, to: '/$region/heatmap' },
  { label: m.shell.navRealms, to: '/$region/realms' },
] as const

const navLink =
  'relative inline-flex h-9 items-center px-2 text-sm font-medium text-muted-foreground hover:text-foreground pointer-coarse:h-11'
const navActive =
  'text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:bg-brand-tomato'

function MainNav({
  region,
  vertical,
  onNavigate,
}: {
  region: Region
  vertical?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav aria-label={m.shell.mainNavLabel()}>
      <ul className={cn('flex', vertical ? 'flex-col gap-1' : 'gap-1')}>
        {NAV.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              params={{ region }}
              activeOptions={{
                exact: item.to === '/$region',
                includeSearch: false,
              }}
              className={navLink}
              activeProps={{ className: navActive, 'aria-current': 'page' }}
              onClick={onNavigate}
            >
              {item.label()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Wordmark() {
  return (
    <Link
      to="/"
      className="text-display !text-[1.25rem] !leading-6 whitespace-nowrap text-primary no-underline"
    >
      {m.shell.wordmarkLead()}{' '}
      <span className="underline decoration-brand-tomato decoration-[3px] underline-offset-4">
        {m.shell.wordmarkAccent()}
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const current = useCurrentRegion()
  const region = useRegion()
  const { open } = useCommandPalette()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="page-wrap flex h-14 items-center gap-3">
        <Wordmark />
        <div className="hidden lg:block">
          <MainNav region={region} />
        </div>
        <div className="hidden flex-1 justify-center md:flex">
          <CommandPaletteTrigger />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {current && (
            <RegionNav current={current} className="hidden lg:block" />
          )}
          <button
            type="button"
            aria-label={m.shell.searchLabel()}
            onClick={open}
            className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent md:hidden pointer-coarse:size-11"
          >
            <Icon name="search" size={20} />
          </button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              aria-label={m.shell.menuOpenLabel()}
              className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent lg:hidden pointer-coarse:size-11"
            >
              <Icon name="menu" size={20} />
            </SheetTrigger>
            <SheetContent
              side="right"
              aria-describedby={undefined}
              className="gap-4 p-4"
            >
              <SheetTitle>{m.shell.menuTitle()}</SheetTitle>
              <MainNav
                region={region}
                vertical
                onNavigate={() => setMenuOpen(false)}
              />
              {current && <RegionNav current={current} />}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
