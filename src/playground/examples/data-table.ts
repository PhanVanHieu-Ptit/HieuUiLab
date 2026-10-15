import { getImplementedEntry, registryHref } from '@/registry'

import { formatImport, indent, jsxProp, tsString } from '../code'
import {
  booleanControl,
  defineControls,
  enumControl,
  numberControl,
  stringControl,
  type ValuesOf,
} from '../controls'
import { definePlaygroundExample } from '../example'
import { DataTableStage, type DataTableConfig } from './data-table-stage'
import { errorMessage, makeDeployments, maxDeployments, statusTone } from './deployments'

/** DataTable's own default, so a page size equal to it is left out of the code. */
const componentDefaultPageSize = 25
/** How many sample rows the code shows; the rest are generated the same way. */
const rowsInCode = 3

const controls = defineControls({
  label: stringControl({
    label: 'Table label',
    default: 'Recent deployments',
    required: true,
    maxLength: 60,
  }),
  state: enumControl({
    label: 'State',
    options: ['ready', 'loading', 'error'],
    default: 'ready',
    display: 'segmented',
  }),
  rows: numberControl({
    label: 'Sample rows (0 shows the empty state)',
    default: 12,
    min: 0,
    max: maxDeployments,
    integer: true,
  }),
  pageSize: numberControl({
    label: 'Rows per page',
    default: 5,
    min: 1,
    max: 100,
    integer: true,
  }),
  showCaption: booleanControl({ label: 'Show caption', default: true }),
  selectable: booleanControl({ label: 'Row selection', default: false }),
  sortable: booleanControl({ label: 'Sortable columns', default: true }),
})

function resolve(values: ValuesOf<typeof controls>): DataTableConfig {
  return values
}

function columnLines(sortable: boolean): string[] {
  const sort = (value: string) => (sortable ? [`sortValue: (row) => ${value},`] : [])
  return [
    'const columns: readonly DataTableColumn<Deployment>[] = [',
    '  {',
    "    id: 'service',",
    "    header: 'Service',",
    '    rowHeader: true,',
    '    cell: (row) => row.service,',
    ...indent(sort('row.service'), 4),
    '  },',
    "  { id: 'environment', header: 'Environment', cell: (row) => row.environment },",
    '  {',
    "    id: 'status',",
    "    header: 'Status',",
    '    cell: (row) => <StatusBadge tone={statusTone[row.status]}>{row.status}</StatusBadge>,',
    ...indent(sort('row.status'), 4),
    '  },',
    '  {',
    "    id: 'duration',",
    "    header: 'Duration',",
    "    align: 'end',",
    "    cell: (row) => (row.durationSeconds === null ? '—' : `${row.durationSeconds}s`),",
    ...indent(sort('row.durationSeconds'), 4),
    '  },',
    ']',
  ]
}

function rowsLines(rows: number): string[] {
  const sample = makeDeployments(Math.min(rows, rowsInCode))
  const note =
    rows > rowsInCode
      ? [
          `// The preview uses ${String(rows)} sample rows; the first ${String(rowsInCode)} are shown.`,
        ]
      : []
  if (sample.length === 0) return ['const deployments: readonly Deployment[] = []']
  return [
    ...note,
    'const deployments: readonly Deployment[] = [',
    ...sample.flatMap((row) => [
      '  {',
      `    id: ${tsString(row.id)},`,
      `    service: ${tsString(row.service)},`,
      `    environment: ${tsString(row.environment)},`,
      `    status: ${tsString(row.status)},`,
      `    durationSeconds: ${row.durationSeconds === null ? 'null' : String(row.durationSeconds)},`,
      '  },',
    ]),
    ']',
  ]
}

function stateExpression(config: DataTableConfig): string {
  if (config.state === 'loading') return "{ status: 'loading' }"
  if (config.state === 'error') return `{ status: 'error', message: ${tsString(errorMessage)} }`
  return "{ status: 'ready', items: deployments }"
}

function code(config: DataTableConfig): string {
  const { label, rows, pageSize, showCaption, selectable, sortable } = config
  const tableProps = [
    jsxProp('label', label),
    'itemName="deployments"',
    ...(showCaption ? ['showCaption'] : []),
    'columns={columns}',
    `state={${stateExpression(config)}}`,
    'getRowId={(row) => row.id}',
    ...(pageSize === componentDefaultPageSize ? [] : [jsxProp('defaultPageSize', pageSize)]),
    ...(selectable
      ? [
          'selection={{',
          '  selectedIds,',
          '  onSelectedIdsChange: setSelectedIds,',
          '  rowLabel: (row) => `Select ${row.service} (${row.id})`,',
          '}}',
        ]
      : []),
  ]

  const lines = [
    ...(selectable ? ["import { useState } from 'react'", ''] : []),
    formatImport(['DataTable', 'type DataTableColumn'], '@/components/blocks/data-table'),
    formatImport(['StatusBadge', 'type StatusTone'], '@/components/ui/status-badge'),
    '',
    'interface Deployment {',
    '  id: string',
    '  service: string',
    "  environment: 'production' | 'staging'",
    "  status: 'live' | 'building' | 'failed'",
    '  durationSeconds: number | null',
    '}',
    '',
    'const statusTone = {',
    ...Object.entries(statusTone).map(([status, tone]) => `  ${status}: ${tsString(tone)},`),
    "} as const satisfies Record<Deployment['status'], StatusTone>",
    '',
    // The rows are only referenced by the ready state.
    ...(config.state === 'ready' ? [...rowsLines(rows), ''] : []),
    // Defined outside the component, so sorting is not redone on every render.
    ...columnLines(sortable),
    '',
    'export function DeploymentsTable() {',
    ...(selectable
      ? ['  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())', '']
      : []),
    '  return (',
    '    <DataTable',
    ...indent(tableProps, 6),
    '    />',
    '  )',
    '}',
    '',
  ]
  return lines.join('\n')
}

const entry = getImplementedEntry('data-table')

export const dataTableExample = definePlaygroundExample({
  id: 'data-table',
  title: 'Data table',
  description:
    'Sample deployments in the registry’s DataTable: states, sorting, paging, and selection.',
  ...(entry ? { docsHref: registryHref(entry) } : {}),
  controls,
  height: 'lg',
  layout: 'fill',
  resolve,
  Stage: DataTableStage,
  code,
})
