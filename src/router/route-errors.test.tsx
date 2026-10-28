import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderRoute } from '@/test/render'

// The About chunk cannot load, as after a deploy removed it: the factory throws, so the route's
// dynamic import rejects.
vi.mock('@/pages/about-page', () => {
  throw new Error('Chunk missing')
})

// The notes index loads but throws while it renders.
vi.mock('@/pages/note-pages', () => ({
  NotesIndexPage: () => {
    throw new Error('Render failed')
  },
  NoteDetailPage: () => null,
}))

describe('a route that fails', () => {
  beforeEach(() => {
    // React and React Router log every caught error; the tests assert what the visitor sees.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('says something went wrong, and keeps the site around it, when a page chunk does not load', async () => {
    await renderRoute('/about')

    // The error page is committed in a transition, after the route has settled.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    // The layout is still there: the visitor can go somewhere else.
    expect(screen.getByRole('banner')).toBeVisible()
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: /Hieu UI Lab/ }),
    ).toBeVisible()
  })

  it('says the same when a page throws while it renders', async () => {
    await renderRoute('/notes')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()
    expect(screen.getByRole('banner')).toBeVisible()
  })

  it('shows the page as usual elsewhere', async () => {
    await renderRoute('/projects')

    expect(screen.queryByRole('heading', { name: 'Something went wrong' })).toBeNull()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Projects and case studies' }),
    ).toBeVisible()
  })

  it('reloads the page when asked to', async () => {
    const reload = vi.fn()
    // The Reload button calls window.location.reload(); nothing else here reads the location.
    vi.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location)
    await renderRoute('/about')

    const button = await screen.findByRole('button', { name: 'Reload page' })
    await userEvent.click(button)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
