import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderRoute } from '@/test/render'

// The site shell itself fails to render. Only the last-resort boundary of the root route is left.
vi.mock('@/components/site/site-layout', () => ({
  SiteLayout: () => {
    throw new Error('Shell failed')
  },
}))

describe('the last-resort error page', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('still tells the visitor what happened and how to leave', async () => {
    await renderRoute('/components')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()
    expect(screen.getByRole('main')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
