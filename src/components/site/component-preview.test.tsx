import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { RegistryExample } from '@/registry/types'

import { ComponentPreview } from './component-preview'

// Highlighting loads Shiki; the plain <pre> is enough here.
vi.mock('@/lib/highlight', () => ({
  highlightCode: () => new Promise<string>(() => undefined),
}))

function NameField() {
  const [name, setName] = useState('')
  return (
    <label>
      Name
      <input
        value={name}
        onChange={(event) => {
          setName(event.target.value)
        }}
      />
    </label>
  )
}

function example(preview?: RegistryExample['preview']): RegistryExample {
  return {
    id: 'demo',
    title: 'Demo',
    component: NameField,
    code: '<NameField />',
    ...(preview ? { preview } : {}),
  }
}

describe('ComponentPreview', () => {
  it('has no width switch unless the example opts in', () => {
    render(<ComponentPreview example={example({ layout: 'fill', height: 'lg' })} />)

    expect(screen.queryByRole('group', { name: 'Preview width' })).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.getByLabelText('Name')).toBeVisible()
  })

  it('offers Full, Tablet, and Mobile widths with Full chosen', () => {
    render(<ComponentPreview example={example({ layout: 'fill', responsive: true })} />)

    const widths = screen.getByRole('group', { name: 'Preview width' })
    expect(screen.getByRole('radio', { name: 'Full' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Tablet 768px' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Mobile 375px' })).not.toBeChecked()
    expect(widths).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Demo preview' })).toHaveAttribute(
      'data-viewport',
      'full',
    )
  })

  it('sizes the frame the example sits in to the chosen width', async () => {
    const user = userEvent.setup()
    render(<ComponentPreview example={example({ layout: 'fill', responsive: true })} />)
    const frame = screen.getByRole('group', { name: 'Demo preview' })

    await user.click(screen.getByRole('radio', { name: 'Tablet 768px' }))
    expect(frame).toHaveAttribute('data-viewport', 'tablet')
    expect(frame).toHaveClass('w-[768px]')

    await user.click(screen.getByRole('radio', { name: 'Mobile 375px' }))
    expect(frame).toHaveAttribute('data-viewport', 'mobile')
    expect(frame).toHaveClass('w-[375px]')

    await user.click(screen.getByRole('radio', { name: 'Full' }))
    expect(frame).toHaveClass('w-full')
  })

  it('keeps the example state when the width changes and when the Code tab is shown', async () => {
    const user = userEvent.setup()
    render(<ComponentPreview example={example({ layout: 'fill', responsive: true })} />)

    await user.type(screen.getByLabelText('Name'), 'Hiếu')
    await user.click(screen.getByRole('radio', { name: 'Mobile 375px' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Hiếu')

    await user.click(screen.getByRole('tab', { name: 'Code' }))
    expect(screen.getByText('<NameField />')).toBeVisible()
    // Still mounted, but its panel is inactive (and hidden by `data-[state=inactive]:hidden`).
    const panel = screen.getByLabelText('Name').closest('[role="tabpanel"]')
    expect(panel).toHaveAttribute('data-state', 'inactive')
    expect(panel).toHaveClass('data-[state=inactive]:hidden')

    await user.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Hiếu')
    expect(screen.getByRole('radio', { name: 'Mobile 375px' })).toBeChecked()
  })

  it('still unmounts a non-responsive example while the Code tab is shown', async () => {
    const user = userEvent.setup()
    render(<ComponentPreview example={example()} />)

    await user.type(screen.getByLabelText('Name'), 'abc')
    await user.click(screen.getByRole('tab', { name: 'Code' }))
    await user.click(screen.getByRole('tab', { name: 'Preview' }))

    expect(screen.getByLabelText('Name')).toHaveValue('')
  })
})
