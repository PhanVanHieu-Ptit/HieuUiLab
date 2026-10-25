import type { ImplementedEntry } from '../types'

export const dataTableEntry: ImplementedEntry = {
  id: 'data-table',
  slug: 'data-table',
  name: 'Data table',
  description:
    'A generic, semantic table for typed rows with sortable columns, client-side pagination, row selection, and explicit loading, empty, and error states.',
  kind: 'block',
  category: 'data-display',
  tags: [
    'a11y',
    'async',
    'keyboard',
    'loading',
    'pagination',
    'responsive',
    'selection',
    'sorting',
  ],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/data-table.tsx',
    packages: ['lucide-react'],
    registryDependencies: [
      'empty-state',
      'error-state',
      'checkbox',
      'pagination',
      'select',
      'skeleton',
      'table',
    ],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Sorting and pagination run in the browser on the rows you pass in. They are intended for up to about 10,000 rows; the tests check correctness at that size, not speed. Only the current page is rendered, and page sizes are capped at 100.',
    'There is no server-side mode, virtualization, multi-column sort, or column resizing. For larger or remote data, sort and page on the server and pass one page of rows with a single page size.',
    'Filtering is the caller’s job: filter the rows before passing them in (see Data toolbar), and reset to page 1 when the filters change. An out-of-range page is clamped rather than shown empty.',
    'Define columns outside the component or memoize them. Sorting is memoized on the column’s sortValue function, so a new function on every render re-sorts on every render.',
    'This is a table, not an ARIA grid: screen readers keep their table navigation, and every control (sort buttons, checkboxes, row actions, pagination) is a native element in the Tab order. When the table is wider than its container, the scroll region becomes focusable so it can be scrolled with the arrow keys.',
    'Put row actions in a cell as buttons or links; do not make the whole row clickable. Mark the column that names each row with rowHeader.',
    'Use hideBelow only for columns whose data is also available elsewhere, such as a detail view. Otherwise let the table scroll horizontally.',
    'Selection is controlled and survives paging. The header checkbox selects or clears the current page. Drop ids that are no longer in the data yourself when the rows change.',
  ],
  api: {
    parts: [
      {
        name: 'DataTable',
        description: 'Generic over the row type T.',
        props: [
          {
            name: 'label',
            type: 'string',
            required: true,
            description: 'Caption of the table and name of its scroll region.',
          },
          {
            name: 'columns',
            type: 'readonly DataTableColumn<T>[]',
            required: true,
            description: 'Column definitions; see DataTableColumn.',
          },
          {
            name: 'state',
            type: "{ status: 'loading' } | { status: 'error'; message? } | { status: 'ready'; items }",
            required: true,
            description:
              'Ready with no items renders the empty state. Same shape as Resource list.',
          },
          {
            name: 'getRowId',
            type: '(row: T) => string',
            required: true,
            description: 'Stable id for keys and selection.',
          },
          {
            name: 'itemName',
            type: 'string',
            default: "'rows'",
            description: 'Plural noun used in messages, e.g. "orders".',
          },
          {
            name: 'showCaption',
            type: 'boolean',
            default: 'false',
            description: 'Show the caption visually; it is always read by assistive tech.',
          },
          {
            name: 'sort / defaultSort / onSortChange',
            type: "{ columnId: string; direction: 'asc' | 'desc' } | null",
            description: 'Controlled or initial sort, and the change callback.',
          },
          {
            name: 'page / onPageChange',
            type: 'number / (page: number) => void',
            description: 'Controlled page (from 1). Uncontrolled when page is omitted.',
          },
          {
            name: 'pageSize / defaultPageSize',
            type: 'number',
            description: 'Rows per page, 1–100. The default page size is 25.',
          },
          {
            name: 'pageSizeOptions',
            type: 'readonly number[]',
            description: 'Shows a rows-per-page select.',
          },
          {
            name: 'onPageSizeChange',
            type: '(pageSize: number) => void',
            description: 'Called when the rows-per-page select changes.',
          },
          {
            name: 'selection',
            type: '{ selectedIds: ReadonlySet<string>; onSelectedIdsChange; rowLabel: (row) => string }',
            description: 'Adds a checkbox column. rowLabel names each row’s checkbox.',
          },
          {
            name: 'activeRowId',
            type: 'string | null',
            description: 'Highlights one row, e.g. the one open in a detail panel.',
          },
          {
            name: 'empty',
            type: '{ title?; description?; action? }',
            description: 'Overrides for the empty state.',
          },
          {
            name: 'onRetry',
            type: '() => void',
            description: 'Shows a retry button in the error state.',
          },
          {
            name: 'skeletonRows',
            type: 'number',
            default: '5',
            description: 'Placeholder rows while loading.',
          },
        ],
      },
      {
        name: 'DataTableColumn<T>',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable column id.' },
          {
            name: 'header',
            type: 'string',
            required: true,
            description: 'Visible and accessible column name.',
          },
          {
            name: 'cell',
            type: '(row: T) => ReactNode',
            required: true,
            description: 'Cell content.',
          },
          {
            name: 'sortValue',
            type: '(row: T) => string | number | Date | null | undefined',
            description:
              'Makes the column sortable. Strings use numeric collation; empty values sort last.',
          },
          {
            name: 'align',
            type: "'start' | 'end'",
            default: "'start'",
            description: 'Use end for numbers.',
          },
          {
            name: 'rowHeader',
            type: 'boolean',
            description: 'Render cells as th scope="row".',
          },
          {
            name: 'hideBelow',
            type: "'sm' | 'md' | 'lg' | 'xl'",
            description: 'Hide the column below a breakpoint.',
          },
          { name: 'className', type: 'string', description: 'Classes for its cells.' },
        ],
      },
      {
        name: 'sortRows / paginateRows',
        description: 'The pure helpers the table uses, exported for tests and reuse.',
        props: [
          {
            name: 'sortRows(rows, getValue, direction)',
            type: 'T[]',
            description: 'A new, stably sorted array. Empty values last in both directions.',
          },
          {
            name: 'paginateRows(rows, page, pageSize)',
            type: '{ rows; page; pageCount; start; end; total }',
            description: 'One page, with the page clamped to the valid range.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
