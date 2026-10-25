import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const tableEntry: ImplementedEntry = {
  id: 'table',
  slug: 'table',
  name: 'Table',
  description:
    'Styled native table parts, plus a sortable column header that sets aria-sort and is operated with a native button.',
  kind: 'component',
  category: 'data-display',
  tags: ['a11y', 'keyboard', 'sorting'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/table.tsx',
    packages: ['lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Use a table for data with rows and columns that are compared; use a list for anything else.',
    'Always give the table a caption, visible or with sr-only, so it has an accessible name.',
    'Wrap the table in an overflow-x-auto container when it can be wider than the screen. Data table does this for you.',
    'Use TableSortHeader only when the column really sorts; the header button announces its column name, and aria-sort on the header announces the direction.',
  ],
  api: {
    parts: [
      {
        name: 'TableSortHeader',
        props: [
          {
            name: 'sortDirection',
            type: "'asc' | 'desc' | null",
            required: true,
            description: 'Direction when this column is the active sort; null otherwise.',
          },
          {
            name: 'onSort',
            type: '() => void',
            required: true,
            description: 'Called on click, Enter, or Space.',
          },
          {
            name: 'align',
            type: "'start' | 'end'",
            default: "'start'",
            description: 'Use end for numeric columns.',
          },
          nativeProps('th'),
        ],
      },
      {
        name: 'TableHead',
        props: [
          {
            name: 'scope',
            type: "'col' | 'row'",
            default: "'col'",
            description: 'Use row for the cell that names a body row.',
          },
          nativeProps('th'),
        ],
      },
      {
        name: 'Table, TableCaption, TableHeader, TableBody, TableRow, TableCell',
        props: [nativeProps('table, caption, thead, tbody, tr, td')],
      },
    ],
  },
  content: () => import('./content'),
}
