import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('ComponentDetailPage', () => {
  it('renders the Button entry with demos, source, and props', () => {
    renderAt('/components/button')

    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Variants' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Button props' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('aria-current', 'page')
  })

  it('switches a demo from Preview to Code', async () => {
    const user = userEvent.setup()
    renderAt('/components/button')

    const tablist = screen.getByRole('tablist', { name: 'Variants example' })
    const codeTab = screen
      .getAllByRole('tab', { name: 'Code' })
      .find((tab) => tablist.contains(tab))
    expect(codeTab).toBeDefined()
    if (!codeTab) return

    await user.click(codeTab)

    expect(codeTab).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel', { name: 'Code' })
    expect(panel).toHaveTextContent('export function ButtonVariantsDemo')
  })

  it('shows a not-found message for an unknown slug', () => {
    renderAt('/components/does-not-exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
