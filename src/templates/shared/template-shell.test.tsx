import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TemplateShell, type ShellView } from './template-shell'

type Id = 'one' | 'two'

const views: readonly ShellView<Id>[] = [
  { id: 'one', label: 'First', icon: <svg data-testid="icon-one" aria-hidden="true" /> },
  {
    id: 'two',
    label: 'Second',
    icon: <svg aria-hidden="true" />,
    badge: { text: '3', label: '3 unread' },
  },
]

function setup(activeView: Id = 'one', onViewChange = vi.fn()) {
  render(
    <TemplateShell
      appName="Example app"
      views={views}
      activeView={activeView}
      onViewChange={onViewChange}
      controls={<p>Example controls</p>}
    >
      <p>The active view</p>
    </TemplateShell>,
  )
  return { onViewChange }
}

describe('TemplateShell', () => {
  it('names the app, says its data is invented, and shows the controls and the view', () => {
    setup()
    expect(screen.getByText('Example app')).toBeVisible()
    expect(screen.getByText('Example app · invented data')).toBeVisible()
    expect(screen.getByText('Example controls')).toBeVisible()
    expect(screen.getByText('The active view')).toBeVisible()
  })

  it('lists the views in a named navigation and marks only the active one', () => {
    setup('two')
    const nav = screen.getByRole('navigation', { name: 'Example app sections' })
    const buttons = within(nav).getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(within(nav).getAllByRole('button', { current: 'page' })).toEqual([buttons[1]])
  })

  it('reports the chosen view', async () => {
    const user = userEvent.setup()
    const { onViewChange } = setup()
    await user.click(screen.getByRole('button', { name: 'Second, 3 unread' }))
    expect(onViewChange).toHaveBeenCalledWith('two')
  })

  it('names a badge for assistive tech, starting with the visible label', () => {
    setup()
    const button = screen.getByRole('button', { name: /^Second/ })
    expect(button).toHaveAccessibleName('Second, 3 unread')
    expect(within(button).getByText('3')).toBeVisible()
    expect(screen.getByRole('button', { name: 'First' })).not.toHaveAttribute('aria-label')
  })

  it('announces the active view politely', () => {
    setup('two')
    expect(screen.getByText('Showing Second')).toHaveAttribute('aria-live', 'polite')
  })

  it('reflows with its own width, not the window', () => {
    setup()
    const root = screen.getByText('Example app').closest('.\\@container')
    expect(root).not.toBeNull()
    expect(screen.getByRole('navigation').parentElement?.className).toContain('@2xl:grid-cols-')
  })
})
