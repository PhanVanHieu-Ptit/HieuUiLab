import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockMatchMedia } from '@/test/media'

import { DetailPanel } from './detail-panel'

const wide = (query: string) => query === '(min-width: 64rem)'
const narrow = () => false

function Harness() {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <>
      {['T-1', 'T-2'].map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            setOpenId(id)
          }}
        >
          Open {id}
        </button>
      ))}
      <button type="button">Elsewhere</button>
      <DetailPanel
        open={openId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
        title={`Ticket ${openId ?? ''}`}
        description="From Amara Okafor"
      >
        <button type="button">Reply</button>
      </DetailPanel>
    </>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DetailPanel inline (wide screens)', () => {
  it('opens as a labelled complementary region and focuses its heading', async () => {
    mockMatchMedia(wide)
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open T-1' }))
    expect(screen.getByRole('complementary', { name: 'Ticket T-1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ticket T-1' })).toHaveFocus()
    // Non-modal: the rest of the page stays available.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open T-2' })).toBeVisible()
  })

  it('closes with Escape and returns focus to the opener', async () => {
    mockMatchMedia(wide)
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open T-1' }))
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close details' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open T-1' })).toHaveFocus()
  })

  it('returns focus to the last opener when another record was opened meanwhile', async () => {
    mockMatchMedia(wide)
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open T-1' }))
    await user.click(screen.getByRole('button', { name: 'Open T-2' }))
    expect(screen.getByRole('complementary', { name: 'Ticket T-2' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close details' }))
    expect(screen.getByRole('button', { name: 'Open T-2' })).toHaveFocus()
  })
})

describe('DetailPanel as a sheet (narrow screens)', () => {
  it('opens as a modal dialog with its description and restores focus on close', async () => {
    mockMatchMedia(narrow)
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open T-2' }))
    const dialog = await screen.findByRole('dialog', { name: 'Ticket T-2' })
    expect(dialog).toHaveAccessibleDescription('From Amara Okafor')
    expect(screen.queryByRole('complementary')).toBeNull()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(screen.getByRole('button', { name: 'Open T-2' })).toHaveFocus()
  })

  it('switches between sheet and inline when the viewport crosses the breakpoint', async () => {
    const change = mockMatchMedia(narrow)
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open T-1' }))
    expect(await screen.findByRole('dialog', { name: 'Ticket T-1' })).toBeInTheDocument()

    act(() => {
      change(wide)
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(screen.getByRole('complementary', { name: 'Ticket T-1' })).toBeInTheDocument()
  })
})
