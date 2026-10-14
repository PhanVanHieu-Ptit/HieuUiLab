import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { getPageItems, Pagination } from './pagination'

describe('getPageItems', () => {
  it('returns nothing for no pages and every page when they fit', () => {
    expect(getPageItems(1, 0)).toEqual([])
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('keeps the first and last page and a gap on the far side', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20])
  })

  it('shows gaps on both sides in the middle, with a constant item count', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20])
    for (let page = 1; page <= 20; page++) expect(getPageItems(page, 20)).toHaveLength(7)
  })

  it('widens with more siblings and clamps an out-of-range page', () => {
    expect(getPageItems(10, 20, 2)).toEqual([
      1,
      'ellipsis-start',
      8,
      9,
      10,
      11,
      12,
      'ellipsis-end',
      20,
    ])
    expect(getPageItems(99, 20)).toEqual(getPageItems(20, 20))
  })
})

function Controlled({ pageCount = 12, onPageChange = vi.fn() }) {
  const [page, setPage] = useState(1)
  return (
    <Pagination
      aria-label="Results pages"
      page={page}
      pageCount={pageCount}
      onPageChange={(next) => {
        setPage(next)
        onPageChange(next)
      }}
    />
  )
}

describe('Pagination', () => {
  it('is a labelled navigation that marks the current page', () => {
    render(<Controlled />)
    const nav = screen.getByRole('navigation', { name: 'Results pages' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Page 2' })).not.toHaveAttribute('aria-current')
    expect(screen.getByText('Page 1 of 12')).toBeInTheDocument()
  })

  it('moves between pages and keeps focus on Previous at the first page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Controlled onPageChange={onPageChange} />)
    const previous = screen.getByRole('button', { name: 'Previous page' })
    const next = screen.getByRole('button', { name: 'Next page' })

    expect(previous).toHaveAttribute('aria-disabled', 'true')
    await user.click(next)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Page 12' }))
    expect(next).toHaveAttribute('aria-disabled', 'true')

    // At the last page, Next is focusable but does nothing.
    next.focus()
    await user.keyboard('{Enter}')
    expect(next).toHaveFocus()
    expect(onPageChange.mock.calls).toEqual([[2], [12]])

    await user.click(previous)
    expect(onPageChange).toHaveBeenLastCalledWith(11)
  })

  it('does not report a click on the current page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Controlled onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Page 1' }))
    expect(onPageChange).not.toHaveBeenCalled()
  })
})
