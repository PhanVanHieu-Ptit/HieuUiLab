import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScrollToHash } from './scroll-to-hash'

function Page({ arrivesLater }: { arrivesLater: boolean }) {
  const [renders, setRenders] = useState(0)
  const [ready, setReady] = useState(!arrivesLater)
  return (
    <>
      <ScrollToHash />
      <button
        onClick={() => {
          setRenders(renders + 1)
        }}
      >
        Render again ({renders})
      </button>
      <button
        onClick={() => {
          setReady(true)
        }}
      >
        Load the page
      </button>
      {ready ? <h2 id="target">Target</h2> : null}
    </>
  )
}

function setup(path: string, arrivesLater = false) {
  const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
  scrollIntoView.mockClear()
  const router = createMemoryRouter(
    [{ path: '*', element: <Page arrivesLater={arrivesLater} /> }],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return { router, scrollIntoView }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('ScrollToHash', () => {
  it('scrolls to the element a fragment names when the page opens', () => {
    const { scrollIntoView } = setup('/page#target')
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('target'))
  })

  it('waits for an element that arrives after the first render', async () => {
    const user = userEvent.setup()
    const { scrollIntoView } = setup('/page#target', true)
    expect(scrollIntoView).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Load the page' }))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('target'))
  })

  it('scrolls once, and leaves the position to the reader on later renders', async () => {
    const user = userEvent.setup()
    const { scrollIntoView } = setup('/page#target')
    await user.click(screen.getByRole('button', { name: /Render again/ }))
    await user.click(screen.getByRole('button', { name: /Render again/ }))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('does nothing without a fragment', () => {
    const { scrollIntoView } = setup('/page')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing, and does not fail, when no element has that id', () => {
    const { scrollIntoView } = setup('/page#missing')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does not fail on a malformed escape in the fragment', () => {
    const { scrollIntoView } = setup('/page#%E0%A4%A')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls to the new fragment after navigating', async () => {
    const { router, scrollIntoView } = setup('/page')
    await act(() => router.navigate('/page#target'))
    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(document.getElementById('target'))
  })
})
