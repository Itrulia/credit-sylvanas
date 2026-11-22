import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { REALMS, realmsFor } from '#/config/realms'
import { RULESET_LABEL, RealmList } from '#/components/realms/realm-list'
import type { RealmsFilter } from '#/components/realms/realm-list'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { RulesetFilter, realmsSearch } from '#/lib/search'
import { REGION_INFO, regionLabel } from '#/config/regions'
import { pageHead } from '#/lib/seo'
import { m } from '#/i18n'

export const Route = createFileRoute('/$region/realms')({
  ssr: true,
  validateSearch: realmsSearch,
  search: { middlewares: [stripSearchParams({ ruleset: 'all' })] },
  head: ({ params }) => {
    const name = regionLabel(params.region)
    return pageHead(
      m.realms.headTitle({ region: name }),
      m.realms.headDescription({ region: name }),
      // an empty state is thin content: keep it out of the index until realms exist
      !REALMS.some((r) => r.region === params.region),
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
        <h1 className="text-display">
          {m.realms.pageTitle({ region: REGION_INFO[region].name })}
        </h1>
        {/* a filter over nothing is noise: no ruleset control while realms.ts is empty */}
        {realms.length > 0 && (
          <ToggleGroup
            type="single"
            variant="outline"
            aria-label={m.realms.rulesetLabel()}
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
