import { useQuery } from '@tanstack/react-query'
import { ClientOnly } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import { formatInt } from '#/lib/format'
import type { IconName } from '#/lib/icons'
import { importLogQuery } from '#/server/fns/imports'
import type { ImportLogRow, ImportStatus } from '#/server/types'
import { DataTable } from '../data-table'
import type { DataColumn } from '../data-table'
import { DateTime } from '../freshness'
import { Icon } from '../icon'
import { SectionBoundary } from '../section-boundary'
import { StatePanel } from '../state-panel'

export const DATA_LOG_HEADING_ID = 'data-log'

const STATUS: Record<
  ImportStatus,
  { label: string; icon: IconName; className: string }
> = {
  imported: {
    label: 'Imported',
    icon: 'check',
    className: 'text-success-text',
  },
  skipped: {
    label: 'Skipped',
    icon: 'info',
    className: 'text-muted-foreground',
  },
  failed: {
    label: 'Failed',
    icon: 'error',
    className: 'text-destructive-text',
  },
}

const missing = <span className="text-muted-foreground">—</span>

const COLUMNS: DataColumn<ImportLogRow>[] = [
  {
    id: 'fetched',
    header: 'Fetched',
    cell: ({ row }) => <DateTime unix={row.original.fetchedAt} />,
  },
  {
    id: 'scan',
    header: 'TSM scan',
    cell: ({ row }) =>
      row.original.updatedAt === null ? (
        missing
      ) : (
        <DateTime unix={row.original.updatedAt} />
      ),
  },
  {
    id: 'source',
    header: 'Region',
    cell: ({ row }) =>
      REGION_INFO[row.original.region].name +
      (row.original.realm ? ` · ${row.original.realm}` : ''),
  },
  {
    id: 'rows',
    header: 'Rows',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="num">{formatInt(row.original.rows)}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = STATUS[row.original.status]
      return (
        <span className="inline-flex items-center gap-1.5">
          <Icon name={status.icon} className={status.className} />
          {status.label}
        </span>
      )
    },
  },
  {
    id: 'reason',
    header: 'Reason',
    cell: ({ row }) => row.original.reason ?? missing,
  },
  {
    id: 'sha',
    header: 'Hash',
    cell: ({ row }) =>
      row.original.sha ? (
        <span className="font-mono">{row.original.sha}</span>
      ) : (
        missing
      ),
  },
]

function DataLogSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2 rounded-md border p-3">
      <span className="sr-only">Loading the data log…</span>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-5 rounded-sm bg-muted" />
      ))}
    </div>
  )
}

function DataLogTable() {
  // throwOnError hands failures to the section boundary
  const { data } = useQuery({
    ...importLogQuery({ limit: 20 }),
    throwOnError: true,
  })
  // errors throw, so no data means still loading
  if (!data) {
    return <DataLogSkeleton />
  }
  if (!data.length) {
    return (
      <StatePanel as="h3" icon="info" title="No imports yet.">
        <p>The first daily price update hasn't run.</p>
      </StatePanel>
    )
  }
  return (
    <DataTable
      caption="Recent price imports"
      label="Recent price imports"
      columns={COLUMNS}
      data={data}
      getRowId={(row) =>
        `${row.fetchedAt}-${row.region}-${row.kind}-${row.realm ?? ''}`
      }
      className="not-prose"
    />
  )
}

/**
 * Recent imports, read after hydration so the prerendered About page never
 * touches D1. Metadata only: no source URL, archive key or file.
 */
export function DataLog() {
  return (
    <ClientOnly fallback={<DataLogSkeleton />}>
      <SectionBoundary headingId={DATA_LOG_HEADING_ID}>
        <DataLogTable />
      </SectionBoundary>
    </ClientOnly>
  )
}
