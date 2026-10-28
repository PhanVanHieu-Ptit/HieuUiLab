import { Archive } from 'lucide-react'
import { useState } from 'react'

import { ConfirmAction } from '@/components/blocks/confirm-action'
import {
  DataTable,
  type DataTableColumn,
  type DataTableState,
} from '@/components/blocks/data-table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Deployment {
  id: string
  service: string
  environment: 'production' | 'staging'
  status: 'live' | 'building' | 'failed'
  durationSeconds: number | null
  finishedAt: string | null
}

// Example data, held in memory.
const deployments: readonly Deployment[] = [
  {
    id: 'd1',
    service: 'checkout-api',
    environment: 'production',
    status: 'live',
    durationSeconds: 94,
    finishedAt: '2026-10-12T09:14:00Z',
  },
  {
    id: 'd2',
    service: 'search-worker',
    environment: 'staging',
    status: 'failed',
    durationSeconds: 41,
    finishedAt: '2026-10-12T08:52:00Z',
  },
  {
    id: 'd3',
    service: 'web',
    environment: 'production',
    status: 'live',
    durationSeconds: 212,
    finishedAt: '2026-10-12T08:30:00Z',
  },
  {
    id: 'd4',
    service: 'web',
    environment: 'staging',
    status: 'building',
    durationSeconds: null,
    finishedAt: null,
  },
  {
    id: 'd5',
    service: 'auth-service',
    environment: 'production',
    status: 'live',
    durationSeconds: 67,
    finishedAt: '2026-10-11T17:03:00Z',
  },
  {
    id: 'd6',
    service: 'billing-api',
    environment: 'staging',
    status: 'live',
    durationSeconds: 128,
    finishedAt: '2026-10-11T15:40:00Z',
  },
  {
    id: 'd7',
    service: 'image-resizer',
    environment: 'production',
    status: 'failed',
    durationSeconds: 19,
    finishedAt: '2026-10-11T12:21:00Z',
  },
  {
    id: 'd8',
    service: 'notifications',
    environment: 'production',
    status: 'live',
    durationSeconds: 85,
    finishedAt: '2026-10-11T10:09:00Z',
  },
  {
    id: 'd9',
    service: 'search-worker',
    environment: 'production',
    status: 'live',
    durationSeconds: 156,
    finishedAt: '2026-10-10T16:55:00Z',
  },
  {
    id: 'd10',
    service: 'checkout-api',
    environment: 'staging',
    status: 'live',
    durationSeconds: 101,
    finishedAt: '2026-10-10T14:12:00Z',
  },
  {
    id: 'd11',
    service: 'admin',
    environment: 'production',
    status: 'live',
    durationSeconds: 240,
    finishedAt: '2026-10-10T09:47:00Z',
  },
  {
    id: 'd12',
    service: 'auth-service',
    environment: 'staging',
    status: 'failed',
    durationSeconds: 12,
    finishedAt: '2026-10-09T18:30:00Z',
  },
]

const statusTone = { live: 'success', building: 'info', failed: 'destructive' } as const
const statusLabel = { live: 'Live', building: 'Building', failed: 'Failed' }
const finished = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

// Defined once, outside the component, so sorting is not redone on every render.
const columns: DataTableColumn<Deployment>[] = [
  {
    id: 'service',
    header: 'Service',
    rowHeader: true,
    sortValue: (row) => row.service,
    cell: (row) => <span className="font-mono text-xs">{row.service}</span>,
  },
  {
    id: 'environment',
    header: 'Environment',
    sortValue: (row) => row.environment,
    cell: (row) => (row.environment === 'production' ? 'Production' : 'Staging'),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusBadge tone={statusTone[row.status]}>{statusLabel[row.status]}</StatusBadge>
    ),
  },
  {
    id: 'duration',
    header: 'Duration',
    align: 'end',
    hideBelow: 'sm',
    sortValue: (row) => row.durationSeconds,
    cell: (row) => (row.durationSeconds === null ? '—' : `${String(row.durationSeconds)} s`),
  },
  {
    id: 'finished',
    header: 'Finished (UTC)',
    className: 'whitespace-nowrap',
    sortValue: (row) => (row.finishedAt ? Date.parse(row.finishedAt) : null),
    cell: (row) =>
      row.finishedAt ? (
        <time dateTime={row.finishedAt}>{finished.format(new Date(row.finishedAt))}</time>
      ) : (
        'In progress'
      ),
  },
]

export function DataTableDemo() {
  return (
    <DataTable
      className="w-full"
      label="Recent deployments"
      showCaption
      itemName="deployments"
      columns={columns}
      state={{ status: 'ready', items: deployments }}
      getRowId={(row) => row.id}
      defaultSort={{ columnId: 'finished', direction: 'desc' }}
      defaultPageSize={5}
      pageSizeOptions={[5, 10, 25]}
    />
  )
}

type DemoState = 'ready' | 'loading' | 'empty' | 'error'

const states: Record<DemoState, DataTableState<Deployment>> = {
  ready: { status: 'ready', items: deployments.slice(0, 4) },
  loading: { status: 'loading' },
  empty: { status: 'ready', items: [] },
  error: { status: 'error', message: 'The deployments service did not respond.' },
}

function isDemoState(value: string): value is DemoState {
  return value in states
}

export function DataTableStatesDemo() {
  const [current, setCurrent] = useState<DemoState>('loading')

  return (
    <Tabs
      variant="pill"
      value={current}
      onValueChange={(value) => {
        if (isDemoState(value)) setCurrent(value)
      }}
      className="w-full"
    >
      <TabsList aria-label="Table state">
        <TabsTrigger value="ready">Ready</TabsTrigger>
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
      </TabsList>
      {(Object.keys(states) as DemoState[]).map((key) => (
        <TabsContent key={key} value={key}>
          <DataTable
            label="Deployments"
            itemName="deployments"
            columns={columns}
            state={states[key]}
            getRowId={(row) => row.id}
            skeletonRows={4}
            empty={{ description: 'Deployments appear here after the first build finishes.' }}
            onRetry={() => {
              setCurrent('ready')
            }}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function DataTableSelectionDemo() {
  const [rows, setRows] = useState<readonly Deployment[]>(deployments)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const count = selectedIds.size

  function archive() {
    setRows((current) => current.filter((row) => !selectedIds.has(row.id)))
    setSelectedIds(new Set())
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {count === 0 ? 'Select deployments to archive them.' : `${String(count)} selected`}
        </p>
        <div className="flex gap-2">
          <ConfirmAction
            trigger={
              <Button
                variant="outline"
                size="sm"
                aria-disabled={count === 0}
                onClick={(event) => {
                  if (count === 0) event.preventDefault()
                }}
              >
                <Archive aria-hidden="true" />
                Archive…
              </Button>
            }
            title={count === 1 ? 'Archive 1 deployment?' : `Archive ${String(count)} deployments?`}
            description="Archived deployments are hidden from this list. Their logs are kept for 30 days."
            confirmLabel="Archive"
            onConfirm={archive}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRows(deployments)
              setSelectedIds(new Set())
            }}
          >
            Reset example
          </Button>
        </div>
      </div>
      <DataTable
        label="Deployments"
        itemName="deployments"
        columns={columns}
        state={{ status: 'ready', items: rows }}
        getRowId={(row) => row.id}
        defaultPageSize={5}
        selection={{
          selectedIds,
          onSelectedIdsChange: setSelectedIds,
          rowLabel: (row) => `Select ${row.service} (${row.environment})`,
        }}
        empty={{
          title: 'Everything is archived',
          description: 'Reset the example to start again.',
        }}
      />
    </div>
  )
}
