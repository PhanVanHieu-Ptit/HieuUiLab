import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  SearchFilterToolbar,
  type FilterToolbarFilter,
  type FilterToolbarValue,
  type FilterToolbarView,
  type SearchFilterToolbarProps,
} from './search-filter-toolbar'

const filters: readonly FilterToolbarFilter[] = [
  {
    id: 'status',
    label: 'Status',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'All statuses' },
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    defaultValue: 'any',
    options: [
      { value: 'any', label: 'Any team' },
      { value: 'design', label: 'Design' },
    ],
  },
]

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'newest', label: 'Newest' },
]

const initial: FilterToolbarValue = { query: '', filters: {}, sort: 'name' }

type HarnessProps = Partial<Omit<SearchFilterToolbarProps, 'value' | 'onValueChange'>> & {
  start?: FilterToolbarValue
  onValueChange?: (value: FilterToolbarValue) => void
}

/** Keeps the value in state the way a consumer would. */
function Harness({ start = initial, onValueChange, ...props }: HarnessProps) {
  const [value, setValue] = useState(start)
  return (
    <SearchFilterToolbar
      filters={filters}
      sortOptions={sortOptions}
      {...props}
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next)
        setValue(next)
      }}
    />
  )
}

async function choose(user: ReturnType<typeof userEvent.setup>, name: string, option: string) {
  screen.getByRole('combobox', { name }).focus()
  await user.keyboard('{Enter}')
  await user.click(await screen.findByRole('option', { name: option }))
}

function chips() {
  return within(screen.getByRole('list', { name: 'Active filters' })).getAllByRole('listitem')
}

describe('SearchFilterToolbar', () => {
  it('is a search landmark with a labelled search field and a labelled control per filter', () => {
    render(<Harness />)

    const search = screen.getByRole('search', { name: 'Search and filter' })
    expect(within(search).getByRole('searchbox', { name: 'Search' })).toBeInTheDocument()
    expect(within(search).getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(within(search).getByRole('combobox', { name: 'Team' })).toBeInTheDocument()
    expect(within(search).getByRole('combobox', { name: 'Sort by' })).toBeInTheDocument()
  })

  it('uses the given labels', () => {
    render(
      <Harness label="Search projects" searchLabel="Find a project" searchPlaceholder="Name" />,
    )

    expect(screen.getByRole('search', { name: 'Search projects' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Find a project' })).toHaveAttribute(
      'placeholder',
      'Name',
    )
  })

  it('has no chips, clear button, or sort select when nothing is active or configured', () => {
    render(<Harness filters={[]} sortOptions={[]} />)

    expect(screen.queryByRole('list', { name: 'Active filters' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('reports the complete next value as the user types', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'ab')

    expect(onValueChange).toHaveBeenLastCalledWith({ query: 'ab', filters: {}, sort: 'name' })
  })

  it('keeps the other criteria when one changes, and shows a chip for it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} start={{ ...initial, query: 'ui' }} />)

    await choose(user, 'Status', 'Archived')

    expect(onValueChange).toHaveBeenLastCalledWith({
      query: 'ui',
      filters: { status: 'archived' },
      sort: 'name',
    })
    expect(chips().map((chip) => chip.textContent)).toEqual(['Search: “ui”', 'Status: Archived'])
  })

  it('does not show a chip for a filter set back to its default or for the sort', async () => {
    const user = userEvent.setup()
    render(<Harness start={{ query: '', filters: { status: 'all' }, sort: 'name' }} />)

    await choose(user, 'Sort by', 'Newest')

    expect(screen.queryByRole('list', { name: 'Active filters' })).toBeNull()
  })

  describe('removing a chip', () => {
    const start: FilterToolbarValue = {
      query: 'ui',
      filters: { status: 'active', team: 'design' },
      sort: 'name',
    }

    it('names each remove button after what it removes', () => {
      render(<Harness start={start} />)

      expect(screen.getByRole('button', { name: 'Remove filter Search: ui' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Remove filter Status: Active' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Remove filter Team: Design' })).toBeInTheDocument()
    })

    it('turns just that criterion off', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Harness start={start} onValueChange={onValueChange} />)

      await user.click(screen.getByRole('button', { name: 'Remove filter Status: Active' }))

      expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
        query: 'ui',
        filters: { status: 'all', team: 'design' },
        sort: 'name',
      })
      expect(chips().map((chip) => chip.textContent)).toEqual(['Search: “ui”', 'Team: Design'])
    })

    it('moves focus to the next chip, then the previous one, then the toolbar', async () => {
      const user = userEvent.setup()
      render(<Harness start={start} />)

      await user.click(screen.getByRole('button', { name: 'Remove filter Search: ui' }))
      expect(screen.getByRole('button', { name: 'Remove filter Status: Active' })).toHaveFocus()

      await user.click(screen.getByRole('button', { name: 'Remove filter Team: Design' }))
      expect(screen.getByRole('button', { name: 'Remove filter Status: Active' })).toHaveFocus()

      await user.click(screen.getByRole('button', { name: 'Remove filter Status: Active' }))
      expect(screen.getByRole('search', { name: 'Search and filter' })).toHaveFocus()
    })
  })

  describe('clearing', () => {
    it('resets the query, the filters, and the sort', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Harness
          start={{ query: 'ui', filters: { status: 'active' }, sort: 'newest' }}
          onValueChange={onValueChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
        query: '',
        filters: {},
        sort: 'name',
      })
      expect(screen.queryByRole('list', { name: 'Active filters' })).toBeNull()
    })
  })

  describe('saved views', () => {
    const everything: FilterToolbarView = { id: 'everything', label: 'Everything', value: initial }
    const activeDesign: FilterToolbarView = {
      id: 'active',
      label: 'Active design',
      value: { query: '', filters: { status: 'active', team: 'design' }, sort: 'newest' },
    }
    const views = [everything, activeDesign]

    function viewButton(name: string) {
      return within(screen.getByRole('group', { name: 'Saved views' })).getByRole('button', {
        name,
      })
    }

    it('shows no views group without views', () => {
      render(<Harness />)

      expect(screen.queryByRole('group', { name: 'Saved views' })).toBeNull()
    })

    it('presses the view that matches the current value', () => {
      render(<Harness views={views} />)

      expect(viewButton('Everything')).toHaveAttribute('aria-pressed', 'true')
      expect(viewButton('Active design')).toHaveAttribute('aria-pressed', 'false')
    })

    it('applies a view as a whole and presses it', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Harness views={views} onValueChange={onValueChange} />)

      await user.click(viewButton('Active design'))

      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(activeDesign.value)
      expect(viewButton('Active design')).toHaveAttribute('aria-pressed', 'true')
      expect(viewButton('Everything')).toHaveAttribute('aria-pressed', 'false')
      expect(chips().map((chip) => chip.textContent)).toEqual(['Status: Active', 'Team: Design'])
    })

    it('stops pressing a view once the value no longer matches it', async () => {
      const user = userEvent.setup()
      render(<Harness views={views} />)

      await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'x')

      expect(viewButton('Everything')).toHaveAttribute('aria-pressed', 'false')
    })

    it('treats explicit defaults and stray spaces as the same value', () => {
      render(
        <Harness
          views={views}
          start={{ query: '  ', filters: { status: 'all', team: 'any' }, sort: 'name' }}
        />,
      )

      expect(viewButton('Everything')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('announces the result count and uses a custom wording', () => {
    render(<Harness resultCount={3} formatResultCount={(count) => `${String(count)} projects`} />)

    expect(screen.getByRole('status')).toHaveTextContent('3 projects')
  })

  it('renders page actions', () => {
    render(<Harness resultCount={1} actions={<button type="button">New project</button>} />)

    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument()
  })

  it('treats the first sort option as the default', () => {
    render(<Harness start={{ query: '', filters: {}, sort: 'name' }} />)

    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveTextContent('Name')
  })
})
