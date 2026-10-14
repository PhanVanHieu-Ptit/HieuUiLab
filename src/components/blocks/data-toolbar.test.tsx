import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'

import { DataToolbar } from './data-toolbar'

const fruits = ['Apple', 'Apricot', 'Banana', 'Cherry']

function Harness({ onReset = vi.fn() }: { onReset?: () => void }) {
  const [query, setQuery] = useState('')
  const [color, setColor] = useState('all')
  const visible = fruits.filter(
    (fruit) =>
      fruit.toLowerCase().includes(query.trim().toLowerCase()) &&
      (color === 'all' ||
        (color === 'red' ? ['Apple', 'Cherry'] : ['Banana', 'Apricot']).includes(fruit)),
  )
  return (
    <>
      <DataToolbar
        search={{ label: 'Search fruit', value: query, onChange: setQuery }}
        filters={[
          {
            id: 'color',
            label: 'Color',
            value: color,
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All colors' },
              { value: 'red', label: 'Red' },
              { value: 'yellow', label: 'Yellow' },
            ],
            onChange: setColor,
          },
        ]}
        resultCount={visible.length}
        formatResultCount={(n) => `${String(n)} fruit`}
        onReset={() => {
          setQuery('')
          setColor('all')
          onReset()
        }}
        actions={<Button>Add fruit</Button>}
      />
      <ul aria-label="Fruit">
        {visible.map((fruit) => (
          <li key={fruit}>{fruit}</li>
        ))}
      </ul>
    </>
  )
}

describe('DataToolbar', () => {
  it('labels every control and announces the result count', () => {
    render(<Harness />)
    expect(screen.getByRole('searchbox', { name: 'Search fruit' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('All colors')
    expect(screen.getByRole('status')).toHaveTextContent('4 fruit')
    expect(screen.getByRole('button', { name: 'Add fruit' })).toBeInTheDocument()
  })

  it('shows Clear filters only while something is filtered', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<Harness onReset={onReset} />)
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()

    await user.type(screen.getByRole('searchbox', { name: 'Search fruit' }), 'ap')
    expect(screen.getByRole('status')).toHaveTextContent('2 fruit')
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.getByRole('searchbox', { name: 'Search fruit' })).toHaveValue('')
    expect(screen.getByRole('status')).toHaveTextContent('4 fruit')
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
  })

  it('ignores whitespace-only searches when deciding whether to offer Clear', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByRole('searchbox', { name: 'Search fruit' }), '   ')
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
  })

  it('applies a filter chosen with the keyboard', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('combobox', { name: 'Color' }).focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('option', { name: 'Red' }))

    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent('Red')
    expect(screen.getByRole('status')).toHaveTextContent('2 fruit')
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
  })

  it('clears the search with Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const search = screen.getByRole('searchbox', { name: 'Search fruit' })
    await user.type(search, 'cher')
    expect(screen.getByRole('status')).toHaveTextContent('1 fruit')
    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
  })
})
