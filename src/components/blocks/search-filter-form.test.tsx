import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SubmitResult } from '@/components/ui/form'

import {
  SearchFilterForm,
  searchFilterSchema,
  type SearchFilterInput,
  type SearchFilterValues,
} from './search-filter-form'

type Handler = (values: SearchFilterValues) => Promise<SubmitResult<SearchFilterInput>>

const validFilters: SearchFilterInput = {
  query: '  ORD-1041 ',
  statuses: ['pending'],
  sort: 'total-desc',
  updatedFrom: '2026-01-01',
  updatedTo: '2026-02-01',
  includeArchived: false,
}

function deferred<T>() {
  let settle: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle?.(value) }
}

function messagesFor(input: Partial<SearchFilterInput>) {
  const result = searchFilterSchema.safeParse({ ...validFilters, ...input })
  return result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) ?? []
}

describe('searchFilterSchema', () => {
  it('trims the query and accepts an open-ended or same-day range', () => {
    expect(searchFilterSchema.parse(validFilters).query).toBe('ORD-1041')
    expect(messagesFor({ updatedFrom: '', updatedTo: '2026-02-01' })).toEqual([])
    expect(messagesFor({ updatedFrom: '2026-02-01', updatedTo: '2026-02-01' })).toEqual([])
  })

  it.each<[string, Partial<SearchFilterInput>, string]>([
    ['no statuses', { statuses: [] }, 'statuses: Choose at least one status.'],
    [
      'a long query',
      { query: 'x'.repeat(101) },
      'query: Shorten the search to 100 characters or fewer.',
    ],
    [
      'an incomplete date',
      { updatedFrom: '2026-13-01' },
      'updatedFrom: Enter a complete date, or leave it empty.',
    ],
    [
      'an end date before the start',
      { updatedFrom: '2026-03-01', updatedTo: '2026-02-01' },
      'updatedTo: The end date must be on or after the start date.',
    ],
  ])('rejects %s', (_case, input, message) => {
    expect(messagesFor(input)).toEqual([message])
  })
})

describe('SearchFilterForm', () => {
  it('is a search landmark that submits the default filters', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>(() => Promise.resolve({ ok: true, message: '3 orders match.' }))
    render(<SearchFilterForm onSubmit={onSubmit} />)

    expect(screen.getByRole('search', { name: 'Filter orders' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSubmit).toHaveBeenCalledWith({
      query: '',
      statuses: ['pending', 'processing', 'shipped'],
      sort: 'updated-desc',
      updatedFrom: '',
      updatedTo: '',
      includeArchived: false,
    })
    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('3 orders match.')
    expect(status).toHaveFocus()
  })

  it('submits what the user entered, with the query trimmed', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>(() => Promise.resolve({ ok: true }))
    render(<SearchFilterForm onSubmit={onSubmit} />)

    await user.type(screen.getByRole('searchbox', { name: 'Search orders' }), '  linh ')
    await user.click(screen.getByRole('checkbox', { name: 'Shipped' }))
    await user.click(screen.getByRole('checkbox', { name: 'Delivered' }))
    await user.type(screen.getByLabelText('Updated from'), '2026-09-01')
    await user.click(screen.getByRole('switch', { name: 'Include archived orders' }))
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSubmit).toHaveBeenCalledWith({
      query: 'linh',
      statuses: ['pending', 'processing', 'delivered'],
      sort: 'updated-desc',
      updatedFrom: '2026-09-01',
      updatedTo: '',
      includeArchived: true,
    })
  })

  it('requires a status, describing the error on the group and focusing its first checkbox', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(<SearchFilterForm onSubmit={onSubmit} defaultValues={{ statuses: ['pending'] }} />)

    expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Pending' }))
    await user.click(screen.getByRole('button', { name: 'Search' }))

    const group = screen.getByRole('group', { name: 'Status' })
    expect(group).toHaveAccessibleDescription('Choose at least one status.')
    expect(screen.getByRole('checkbox', { name: 'Pending' })).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('checkbox', { name: 'Cancelled' }))
    expect(group).not.toHaveAttribute('aria-describedby')
  })

  it('reports an inverted date range on the end date and clears it when the start moves', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(
      <SearchFilterForm
        onSubmit={onSubmit}
        defaultValues={{ updatedFrom: '2026-03-01', updatedTo: '2026-02-01' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Search' }))

    const updatedTo = screen.getByLabelText('Updated to')
    expect(updatedTo).toBeInvalid()
    expect(updatedTo).toHaveAccessibleDescription(
      'The end date must be on or after the start date.',
    )
    expect(updatedTo).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()

    const updatedFrom = screen.getByLabelText('Updated from')
    await user.clear(updatedFrom)
    await user.type(updatedFrom, '2026-01-15')
    expect(updatedTo).toBeValid()
  })

  it('clears the query with its clear button', async () => {
    const user = userEvent.setup()
    render(<SearchFilterForm onSubmit={vi.fn<Handler>()} defaultValues={{ query: 'linh' }} />)

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    const searchbox = screen.getByRole('searchbox', { name: 'Search orders' })
    expect(searchbox).toHaveValue('')
    expect(searchbox).toHaveFocus()
  })

  it('disables the filters while searching', async () => {
    const user = userEvent.setup()
    const search = deferred<SubmitResult<SearchFilterInput>>()
    render(<SearchFilterForm onSubmit={() => search.promise} />)

    await user.click(screen.getByRole('button', { name: 'Search' }))

    const button = screen.getByRole('button', { name: 'Searching…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('searchbox', { name: 'Search orders' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Pending' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeDisabled()

    search.resolve({ ok: true, message: 'No orders match.' })

    expect(await screen.findByRole('status')).toHaveTextContent('No orders match.')
    expect(screen.getByRole('searchbox', { name: 'Search orders' })).toBeEnabled()
  })

  it('reports a failed search without losing the filters', async () => {
    const user = userEvent.setup()
    render(
      <SearchFilterForm
        defaultValues={{ query: 'linh' }}
        onSubmit={() => Promise.reject(new Error('Service unavailable'))}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Search' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Search failed')
    expect(alert).toHaveTextContent('The search could not be completed. Try again.')
    expect(screen.getByRole('searchbox', { name: 'Search orders' })).toHaveValue('linh')
  })

  it('resets to the defaults, clears feedback, and tells the parent', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(
      <SearchFilterForm
        onSubmit={() => Promise.resolve({ ok: true, message: '2 orders match.' })}
        onReset={onReset}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Search orders' }), 'linh')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('status')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(screen.getByRole('searchbox', { name: 'Search orders' })).toHaveValue('')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('disables everything and never submits when disabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(<SearchFilterForm disabled onSubmit={onSubmit} />)

    expect(screen.getByRole('searchbox', { name: 'Search orders' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
