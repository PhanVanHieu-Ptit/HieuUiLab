import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  DataTable,
  paginateRows,
  sortRows,
  type DataTableColumn,
  type DataTableProps,
  type DataTableState,
} from './data-table'

interface Row {
  id: string
  name: string
  size: number | null
  updated: Date | null
}

const rows: readonly Row[] = [
  { id: 'a', name: 'item 10', size: 30, updated: new Date('2026-01-03') },
  { id: 'b', name: 'Item 2', size: null, updated: new Date('2026-01-01') },
  { id: 'c', name: 'item 1', size: 10, updated: null },
  { id: 'd', name: 'Ítem 3', size: 20, updated: new Date('2026-01-02') },
]

describe('sortRows', () => {
  const ids = (list: readonly Row[]) => list.map((row) => row.id)

  it('compares strings with numeric, case- and accent-insensitive collation', () => {
    expect(ids(sortRows(rows, (row) => row.name, 'asc'))).toEqual(['c', 'b', 'd', 'a'])
    expect(ids(sortRows(rows, (row) => row.name, 'desc'))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('sorts numbers and dates, with empty values last in both directions', () => {
    expect(ids(sortRows(rows, (row) => row.size, 'asc'))).toEqual(['c', 'd', 'a', 'b'])
    expect(ids(sortRows(rows, (row) => row.size, 'desc'))).toEqual(['a', 'd', 'c', 'b'])
    expect(ids(sortRows(rows, (row) => row.updated, 'asc'))).toEqual(['b', 'd', 'a', 'c'])
    expect(ids(sortRows(rows, (row) => row.updated, 'desc'))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('treats NaN and invalid dates as empty', () => {
    const odd = [
      { id: 'x', value: Number.NaN },
      { id: 'y', value: 1 },
      { id: 'z', value: new Date('not a date') },
    ]
    expect(sortRows(odd, (row) => row.value, 'asc').map((row) => row.id)).toEqual(['y', 'x', 'z'])
  })

  it('is stable and does not mutate its input', () => {
    const input = [
      { id: '1', group: 'b' },
      { id: '2', group: 'a' },
      { id: '3', group: 'b' },
      { id: '4', group: 'a' },
    ]
    const copy = [...input]
    expect(sortRows(input, (row) => row.group, 'asc').map((row) => row.id)).toEqual([
      '2',
      '4',
      '1',
      '3',
    ])
    expect(sortRows(input, (row) => row.group, 'desc').map((row) => row.id)).toEqual([
      '1',
      '3',
      '2',
      '4',
    ])
    expect(input).toEqual(copy)
  })

  it('sorts 10,000 rows correctly, reading each value once', () => {
    const many = Array.from({ length: 10_000 }, (_, index) => ({
      id: index,
      value: (index * 7919) % 10_007,
    }))
    const getValue = vi.fn((row: { value: number }) => row.value)
    const sorted = sortRows(many, getValue, 'asc')
    expect(getValue).toHaveBeenCalledTimes(10_000)
    expect(sorted).toHaveLength(10_000)
    for (let index = 1; index < sorted.length; index++) {
      expect((sorted[index - 1]?.value ?? 0) <= (sorted[index]?.value ?? 0)).toBe(true)
    }
  })
})

describe('paginateRows', () => {
  const list = Array.from({ length: 23 }, (_, index) => index + 1)

  it('returns one page with its position', () => {
    expect(paginateRows(list, 2, 10)).toEqual({
      rows: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      page: 2,
      pageCount: 3,
      start: 11,
      end: 20,
      total: 23,
    })
  })

  it('returns a partial last page', () => {
    expect(paginateRows(list, 3, 10)).toMatchObject({ rows: [21, 22, 23], start: 21, end: 23 })
  })

  it('clamps pages out of range instead of returning an empty page', () => {
    expect(paginateRows(list, 9, 10).page).toBe(3)
    expect(paginateRows(list, 0, 10).page).toBe(1)
    expect(paginateRows(list, Number.NaN, 10).page).toBe(1)
  })

  it('handles no rows and caps the page size at 100', () => {
    expect(paginateRows([], 4, 10)).toEqual({
      rows: [],
      page: 1,
      pageCount: 1,
      start: 0,
      end: 0,
      total: 0,
    })
    expect(
      paginateRows(
        Array.from({ length: 500 }, () => 0),
        1,
        1000,
      ).rows,
    ).toHaveLength(100)
  })
})

const columns: DataTableColumn<Row>[] = [
  {
    id: 'name',
    header: 'Name',
    rowHeader: true,
    sortValue: (row) => row.name,
    cell: (row) => row.name,
  },
  {
    id: 'size',
    header: 'Size',
    align: 'end',
    sortValue: (row) => row.size,
    cell: (row) => (row.size === null ? '—' : String(row.size)),
  },
  { id: 'note', header: 'Note', cell: () => 'n/a' },
]

function renderTable(props: Partial<DataTableProps<Row>> = {}) {
  return render(
    <DataTable
      label="Files"
      itemName="files"
      columns={columns}
      state={{ status: 'ready', items: rows }}
      getRowId={(row) => row.id}
      {...props}
    />,
  )
}

/** Row header text of each body row, top to bottom. */
function rowNames() {
  return screen.getAllByRole('rowheader').map((cell) => cell.textContent)
}

describe('DataTable', () => {
  it('renders a captioned table with column and row headers', () => {
    renderTable()
    const table = screen.getByRole('table', { name: 'Files' })
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Name', 'Size', 'Note'])
    expect(rowNames()).toEqual(['item 10', 'Item 2', 'item 1', 'Ítem 3'])
    expect(screen.getByRole('region', { name: 'Files' })).toBeInTheDocument()
    // Only sortable columns get a button.
    expect(screen.queryByRole('button', { name: 'Note' })).toBeNull()
  })

  it('cycles a column through ascending, descending, and the original order', async () => {
    const user = userEvent.setup()
    renderTable()
    const header = screen.getByRole('columnheader', { name: 'Size' })
    const button = screen.getByRole('button', { name: 'Size' })

    await user.click(button)
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(rowNames()).toEqual(['item 1', 'Ítem 3', 'item 10', 'Item 2'])

    await user.click(button)
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(rowNames()).toEqual(['item 10', 'Ítem 3', 'item 1', 'Item 2'])

    await user.click(button)
    expect(header).not.toHaveAttribute('aria-sort')
    expect(rowNames()).toEqual(['item 10', 'Item 2', 'item 1', 'Ítem 3'])
  })

  it('moves aria-sort to the newly sorted column', async () => {
    const user = userEvent.setup()
    renderTable({ defaultSort: { columnId: 'size', direction: 'desc' } })
    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect(screen.getByRole('columnheader', { name: 'Size' })).not.toHaveAttribute('aria-sort')
  })

  it('reports sort changes when controlled and resets to page 1', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    const onPageChange = vi.fn()
    renderTable({
      sort: { columnId: 'name', direction: 'asc' },
      onSortChange,
      page: 2,
      onPageChange,
      pageSize: 2,
    })
    // Controlled: the table shows the sort it is given.
    expect(rowNames()).toEqual(['Ítem 3', 'item 10'])
    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'name', direction: 'desc' })
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('pages through rows and shows the range', async () => {
    const user = userEvent.setup()
    renderTable({ defaultPageSize: 3 })
    expect(rowNames()).toHaveLength(3)
    expect(screen.getByText('1–3 of 4 files')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(rowNames()).toEqual(['Ítem 3'])
    expect(screen.getByText('4–4 of 4 files')).toBeInTheDocument()
  })

  it('hides pagination when everything fits on one page', () => {
    renderTable()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('sorts across all pages, not just the visible one, and returns to page 1', async () => {
    const user = userEvent.setup()
    renderTable({ defaultPageSize: 2 })
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(rowNames()).toEqual(['item 1', 'Ítem 3'])

    await user.click(screen.getByRole('button', { name: 'Size' }))
    expect(rowNames()).toEqual(['item 1', 'Ítem 3'])
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(rowNames()).toEqual(['item 10', 'Item 2'])
  })

  it('renders only one page of a large data set', () => {
    const many = Array.from({ length: 10_000 }, (_, index) => ({
      id: String(index),
      name: `row ${String(index)}`,
      size: index,
      updated: null,
    }))
    renderTable({ state: { status: 'ready', items: many }, defaultPageSize: 50 })
    expect(rowNames()).toHaveLength(50)
    expect(screen.getByText('1–50 of 10000 files')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 200' })).toBeInTheDocument()
  })

  describe('states', () => {
    function renderState(state: DataTableState<Row>, extra: Partial<DataTableProps<Row>> = {}) {
      return renderTable({ state, ...extra })
    }

    it('keeps the headers and announces loading', () => {
      renderState({ status: 'loading' }, { skeletonRows: 2 })
      expect(screen.getByRole('status')).toHaveTextContent('Loading files…')
      expect(screen.getByRole('table', { name: 'Files' })).toHaveAttribute('aria-busy', 'true')
      expect(screen.getAllByRole('columnheader')).toHaveLength(3)
      // Header row plus two placeholder rows.
      expect(screen.getAllByRole('row')).toHaveLength(3)
    })

    it('shows an alert with retry on error', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      renderState({ status: 'error', message: 'The request timed out.' }, { onRetry })
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Couldn’t load files')
      expect(alert).toHaveTextContent('The request timed out.')
      await user.click(within(alert).getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('shows the empty state inside the table, with custom copy', () => {
      renderState(
        { status: 'ready', items: [] },
        { empty: { title: 'No files match', description: 'Clear the search.' } },
      )
      const table = screen.getByRole('table', { name: 'Files' })
      expect(within(table).getByRole('heading', { name: 'No files match' })).toBeInTheDocument()
      expect(within(table).getByRole('cell')).toHaveAttribute('colspan', '3')
      expect(screen.queryByRole('navigation')).toBeNull()
    })

    it('uses a default empty title', () => {
      renderState({ status: 'ready', items: [] })
      expect(screen.getByRole('heading', { name: 'No files yet' })).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    function Selectable({ onChange }: { onChange?: (ids: string[]) => void }) {
      const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
      return (
        <DataTable
          label="Files"
          itemName="files"
          columns={columns}
          state={{ status: 'ready', items: rows }}
          getRowId={(row) => row.id}
          defaultPageSize={2}
          selection={{
            selectedIds,
            onSelectedIdsChange: (ids) => {
              setSelectedIds(ids)
              onChange?.([...ids].sort())
            },
            rowLabel: (row) => `Select ${row.name}`,
          }}
        />
      )
    }

    it('selects rows with checkboxes named after each row', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Selectable onChange={onChange} />)

      await user.click(screen.getByRole('checkbox', { name: 'Select item 10' }))
      expect(onChange).toHaveBeenLastCalledWith(['a'])
      expect(
        screen.getByRole('checkbox', { name: 'Select all rows on this page' }),
      ).toHaveAttribute('aria-checked', 'mixed')
      expect(screen.getByText(/1 selected/)).toBeInTheDocument()
    })

    it('selects and clears the current page from the header checkbox', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Selectable onChange={onChange} />)
      const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' })

      await user.click(all)
      expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
      expect(all).toBeChecked()
      await user.click(all)
      expect(onChange).toHaveBeenLastCalledWith([])
    })

    it('completes a partly selected page from the header checkbox', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Selectable onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: 'Select Item 2' }))
      await user.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }))
      expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
    })

    it('keeps the selection while paging', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Selectable onChange={onChange} />)

      await user.click(screen.getByRole('checkbox', { name: 'Select item 10' }))
      await user.click(screen.getByRole('button', { name: 'Next page' }))
      const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' })
      expect(all).not.toBeChecked()
      await user.click(screen.getByRole('checkbox', { name: 'Select item 1' }))
      expect(onChange).toHaveBeenLastCalledWith(['a', 'c'])
      expect(screen.getByText(/2 selected/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Previous page' }))
      expect(screen.getByRole('checkbox', { name: 'Select item 10' })).toBeChecked()
    })

    it('toggles rows with Space', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Selectable onChange={onChange} />)
      screen.getByRole('checkbox', { name: 'Select Item 2' }).focus()
      await user.keyboard(' ')
      expect(onChange).toHaveBeenLastCalledWith(['b'])
    })
  })

  it('reaches every control with Tab, in reading order', async () => {
    const user = userEvent.setup()
    renderTable({ defaultPageSize: 2 })

    await user.tab()
    expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'Size' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveFocus()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveFocus()
  })
})
