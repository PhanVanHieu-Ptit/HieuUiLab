import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type * as Manifest from '@/notes/manifest'
import { renderRoute } from '@/test/render'

// A tag in the vocabulary that no article carries cannot be reached with the real articles once
// every tag is in use, so the filter is stubbed to find nothing.
vi.mock('@/notes/manifest', async (importOriginal) => ({
  ...(await importOriginal<typeof Manifest>()),
  filterNotes: () => [],
}))

describe('the notes index when a tag has no article', () => {
  it('says so, and offers a way back to every article', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/notes?tag=react')
    expect(
      screen.getByRole('heading', { level: 2, name: 'No articles with this tag' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Articles' })).toBeNull()

    const [back] = screen.getAllByRole('button', { name: 'Show all articles' })
    if (!back) throw new Error('There must be a way back to every article')
    await user.click(back)
    expect(router.state.location.search).toBe('')
  })
})
