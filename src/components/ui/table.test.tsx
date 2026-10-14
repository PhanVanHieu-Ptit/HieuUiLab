import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortHeader,
  type SortDirection,
} from './table'

function SortableTable({ onSort }: { onSort?: (direction: SortDirection) => void }) {
  const [direction, setDirection] = useState<SortDirection | null>(null)
  return (
    <Table>
      <TableCaption>Plans</TableCaption>
      <TableHeader>
        <TableRow>
          <TableSortHeader
            sortDirection={direction}
            onSort={() => {
              const next = direction === 'asc' ? 'desc' : 'asc'
              setDirection(next)
              onSort?.(next)
            }}
          >
            Plan
          </TableSortHeader>
          <TableHead>Seats</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">Team</TableHead>
          <TableCell>10</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

describe('Table', () => {
  it('keeps native table semantics with a caption as its name', () => {
    render(<SortableTable />)
    expect(screen.getByRole('table', { name: 'Plans' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Seats' })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('rowheader', { name: 'Team' })).toHaveAttribute('scope', 'row')
    expect(screen.getByRole('cell', { name: '10' })).toBeInTheDocument()
  })
})

describe('TableSortHeader', () => {
  it('names its button after the column and sets aria-sort only while sorted', async () => {
    const user = userEvent.setup()
    render(<SortableTable />)
    const header = screen.getByRole('columnheader', { name: 'Plan' })
    const button = screen.getByRole('button', { name: 'Plan' })

    expect(header).not.toHaveAttribute('aria-sort')
    await user.click(button)
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    await user.click(button)
    expect(header).toHaveAttribute('aria-sort', 'descending')
  })

  it('sorts from the keyboard with Enter and Space', async () => {
    const user = userEvent.setup()
    const onSort = vi.fn()
    render(<SortableTable onSort={onSort} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onSort.mock.calls).toEqual([['asc'], ['desc']])
    expect(screen.getByRole('columnheader', { name: 'Plan' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })
})
