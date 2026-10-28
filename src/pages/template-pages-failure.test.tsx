import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderRoute } from '@/test/render'

// Admin dashboard is a template whose chunk cannot load, as after a deploy removed it. Operations
// monitoring loads, as a stand-in that is easy to recognise.
vi.mock('@/templates/template-modules', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  loadTemplate: (slug: string) =>
    slug === 'operations-monitoring'
      ? Promise.resolve({ Template: () => <p>Stand-in template</p>, source: '' })
      : Promise.reject(new Error('Chunk missing')),
}))

describe('Template detail when the template fails to load', () => {
  it('contains the failure and keeps the rest of the page', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await renderRoute('/templates/admin-dashboard')

    expect(await screen.findByText('This demo couldn’t load')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Admin dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Blocks used' })).toBeInTheDocument()
    error.mockRestore()
  })

  it('does not carry the failure over to the next template', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { router } = await renderRoute('/templates/admin-dashboard')
    expect(await screen.findByText('This demo couldn’t load')).toBeInTheDocument()

    // Same route, new template: the page component is reused, so the boundary has to start over.
    await act(() => router.navigate('/templates/operations-monitoring'))

    await waitFor(() => {
      expect(screen.getByText('Stand-in template')).toBeInTheDocument()
    })
    expect(screen.queryByText('This demo couldn’t load')).toBeNull()
    error.mockRestore()
  })
})
