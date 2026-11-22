import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { realmsFor } from '#/config/realms'
import { RULESET_LABEL, RealmList } from '#/components/realms/realm-list'
import type { RealmsFilter } from '#/components/realms/realm-list'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { RulesetFilter, realmsSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/$region/realms')({
  ssr: true,
  validateSearch: realmsSearch,
  search: { middlewares: [stripSearchParams({ ruleset: 'all' })] },
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      `Realms · ${name} Forever AH`,
      `Pick a ${name} Forever realm to see realm prices.`,
    )
  },
  component: Realms,
})

function Realms() {
  const { region } = Route.useRouteContext()
  const { ruleset } = Route.useSearch()
  const navigate = Route.useNavigate()
  const realms = realmsFor(region)
  return (
    <div className="page-wrap space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-display">Realms</h1>
        {/* a filter over nothing is noise: no ruleset control while realms.ts is empty */}
        {realms.length > 0 && (
          <ToggleGroup
            type="single"
            variant="outline"
            aria-label="Ruleset"
            value={ruleset}
            onValueChange={(value) => {
              // radix sends '' when the pressed item is clicked again
              if (value) {
                void navigate({
                  search: { ruleset: value as RealmsFilter },
                  replace: true,
                })
              }
            }}
          >
            {RulesetFilter.options.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                className="pointer-coarse:h-11"
              >
                {RULESET_LABEL[option]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      <RealmList region={region} realms={realms} ruleset={ruleset} />
    </div>
  )
}
