import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderRoute } from '@/test/render'

// A template whose chunk cannot load, as after a deploy removed it.
vi.mock('@/templates/template-modules', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  loadTemplate: () => Promise.reject(new Error('Chunk missing')),
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
})
