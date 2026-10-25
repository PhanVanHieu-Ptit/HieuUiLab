import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CopyButton } from './copy-button'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// The announcement is the only feedback a screen reader user gets, so each state is read from the
// status region, not from the icon.
const status = () => screen.getByRole('status')

describe('CopyButton', () => {
  it('copies exactly the value and says so', async () => {
    // Created before rendering: the button checks for the clipboard when it mounts.
    const user = userEvent.setup()
    render(<CopyButton value={'line one\n  line two'} label="Copy the sample" />)

    await user.click(screen.getByRole('button', { name: 'Copy the sample' }))

    expect(await navigator.clipboard.readText()).toBe('line one\n  line two')
    expect(status()).toHaveTextContent('Copied to clipboard')
  })

  it('says the copy failed when the browser refuses, and does not claim it worked', async () => {
    const user = userEvent.setup()
    render(<CopyButton value="secret" />)
    const refused = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValueOnce(new DOMException('Write permission denied.', 'NotAllowedError'))

    await user.click(screen.getByRole('button', { name: 'Copy code' }))

    expect(refused).toHaveBeenCalledWith('secret')
    expect(await screen.findByText('Copy failed')).toBeInTheDocument()
    expect(status()).not.toHaveTextContent('Copied to clipboard')
  })

  it('recovers from a refusal: the next click copies and says so', async () => {
    const user = userEvent.setup()
    render(<CopyButton value="again" />)
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'))

    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByText('Copy failed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toBe('again')
  })

  it.each([
    ['success', undefined],
    ['failure', new Error('denied')],
  ])('goes quiet again two seconds after a %s', async (_, failure) => {
    // Only the timer the button uses: React's act() waits on the others. user-event's own delays
    // would wait on the fake one, so the click is dispatched directly; userEvent.setup() is still
    // what installs the clipboard.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    userEvent.setup()
    render(<CopyButton value="x" />)
    if (failure) vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(failure)

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(status()).toHaveTextContent(failure ? 'Copy failed' : 'Copied to clipboard')

    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(status()).not.toBeEmptyDOMElement()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(status()).toBeEmptyDOMElement()
  })

  it('renders nothing where the clipboard API is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    try {
      const { container } = render(<CopyButton value="x" />)
      expect(container).toBeEmptyDOMElement()
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })
})
