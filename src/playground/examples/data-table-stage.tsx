import { useMemo, useState } from 'react'

import {
  DataTable,
  type DataTableColumn,
  type DataTableState,
} from '@/components/blocks/data-table'
import { StatusBadge } from '@/components/ui/status-badge'

import type { StageProps } from '../example'
import {
  errorMessage,
  formatDuration,
  makeDeployments,
  statusTone,
  type Deployment,
} from './deployments'

export interface DataTableConfig {
  readonly label: string
  readonly state: 'ready' | 'loading' | 'error'
  readonly rows: number
  readonly pageSize: number
  readonly showCaption: boolean
  readonly selectable: boolean
  readonly sortable: boolean
}

function buildColumns(sortable: boolean): readonly DataTableColumn<Deployment>[] {
  return [
    {
      id: 'service',
      header: 'Service',
      rowHeader: true,
      cell: (row) => row.service,
      ...(sortable ? { sortValue: (row: Deployment) => row.service } : {}),
    },
    { id: 'environment', header: 'Environment', cell: (row) => row.environment },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge tone={statusTone[row.status]}>{row.status}</StatusBadge>,
      ...(sortable ? { sortValue: (row: Deployment) => row.status } : {}),
    },
    {
      id: 'duration',
      header: 'Duration',
      align: 'end',
      cell: (row) => formatDuration(row.durationSeconds),
      ...(sortable ? { sortValue: (row: Deployment) => row.durationSeconds } : {}),
    },
  ]
}

// Defined once, as the DataTable guidelines ask: a new sortValue function re-sorts every render.
const plainColumns = buildColumns(false)
const sortableColumns = buildColumns(true)

/** The registry's DataTable over generated sample rows. Selection is kept here, in the stage. */
export function DataTableStage({ config }: StageProps<DataTableConfig>) {
  const { label, state, rows, pageSize, showCaption, selectable, sortable } = config
  const items = useMemo(() => makeDeployments(rows), [rows])
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())

  const tableState: DataTableState<Deployment> =
    state === 'ready'
      ? { status: 'ready', items }
      : state === 'loading'
        ? { status: 'loading' }
        : { status: 'error', message: errorMessage }

  return (
    <DataTable
      label={label}
      itemName="deployments"
      showCaption={showCaption}
      columns={sortable ? sortableColumns : plainColumns}
      state={tableState}
      getRowId={(row) => row.id}
      defaultPageSize={pageSize}
      {...(selectable
        ? {
            selection: {
              selectedIds,
              onSelectedIdsChange: setSelectedIds,
              rowLabel: (row: Deployment) => `Select ${row.service} (${row.id})`,
            },
          }
        : {})}
    />
  )
}
