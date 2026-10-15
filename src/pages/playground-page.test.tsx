import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

const main = () => within(screen.getByRole('main'))
const examples = () => main().getByRole('navigation', { name: 'Playground examples' })
const controls = () => main().getByRole('form', { name: 'Example controls' })

describe('PlaygroundPage', () => {
  it('opens on Button, with every example listed once', async () => {
    await renderRoute('/playground')
    expect(main().getByRole('heading', { level: 1, name: 'Playground' })).toBeInTheDocument()
    expect(main().getByRole('heading', { level: 2, name: 'Button' })).toBeInTheDocument()
    expect(
      within(examples())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Button', 'Input', 'Badge', 'Dialog', 'Data table'])
    expect(within(examples()).getByRole('link', { name: 'Button' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('says plainly that it is not a code editor', async () => {
    await renderRoute('/playground')
    // Said in the page description and again beside the examples.
    expect(main().getAllByText(/not a code editor/)).toHaveLength(2)
    expect(main().getByText(/never compiles or runs code you type/)).toBeInTheDocument()
    expect(main().queryByRole('textbox', { name: /code/i })).toBeNull()
  })

  it('opens the example named in the URL', async () => {
    await renderRoute('/playground?example=dialog')
    expect(main().getByRole('heading', { level: 2, name: 'Dialog' })).toBeInTheDocument()
    expect(within(examples()).getByRole('link', { name: 'Dialog' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(examples()).getByRole('link', { name: 'Button' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('links to the documentation of the component it shows', async () => {
    await renderRoute('/playground?example=data-table')
    expect(main().getByRole('link', { name: 'Data table documentation' })).toHaveAttribute(
      'href',
      '/blocks/data-table',
    )
  })

  it('shows the first example, and says so, for an id it does not know', async () => {
    const { router } = await renderRoute('/playground?example=nope')
    expect(main().getByRole('heading', { level: 2, name: 'Button' })).toBeInTheDocument()
    expect(main().getByText(/There is no example called “nope”/)).toHaveAttribute('role', 'status')
    // The address is left alone.
    expect(router.state.location.search).toBe('?example=nope')
  })

  it.each(['__proto__', 'constructor', 'toString', '', ' dialog', 'DIALOG'])(
    'does not treat %j as an example',
    async (id) => {
      await renderRoute(`/playground?example=${encodeURIComponent(id)}`)
      expect(main().getByRole('heading', { level: 2, name: 'Button' })).toBeInTheDocument()
    },
  )

  it('changes the example from the list, and the address with it', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/playground')
    await user.click(within(examples()).getByRole('link', { name: 'Badge' }))

    await waitFor(() => {
      expect(main().getByRole('heading', { level: 2, name: 'Badge' })).toBeInTheDocument()
    })
    expect(router.state.location.search).toBe('?example=badge')
    expect(within(examples()).getByRole('link', { name: 'Badge' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('keeps nothing from one example when another is chosen', async () => {
    const user = userEvent.setup()
    await renderRoute('/playground')

    // Change as much as there is to change on Button.
    await user.selectOptions(
      within(controls()).getByRole('combobox', { name: 'Variant' }),
      'destructive',
    )
    await user.click(within(controls()).getByRole('switch', { name: 'Disabled' }))
    await user.click(main().getByRole('radio', { name: 'Dark' }))
    await user.click(main().getByRole('radio', { name: 'Mobile 375px' }))

    // Input has a control with the same name and a different meaning.
    await user.click(within(examples()).getByRole('link', { name: 'Input' }))
    await waitFor(() => {
      expect(main().getByRole('heading', { level: 2, name: 'Input' })).toBeInTheDocument()
    })
    expect(within(controls()).getByRole('switch', { name: 'Disabled' })).not.toBeChecked()
    expect(main().getByRole('radio', { name: 'Site' })).toBeChecked()
    expect(main().getByRole('radio', { name: 'Full' })).toBeChecked()
    expect(main().getByRole('group', { name: 'Input preview' })).not.toHaveClass('dark')
    expect(main().getByRole('textbox', { name: 'Email' })).toBeEnabled()

    // And back again: Button starts over rather than remembering.
    await user.click(within(examples()).getByRole('link', { name: 'Button' }))
    await waitFor(() => {
      expect(main().getByRole('heading', { level: 2, name: 'Button' })).toBeInTheDocument()
    })
    expect(within(controls()).getByRole('combobox', { name: 'Variant' })).toHaveValue('default')
    expect(within(controls()).getByRole('switch', { name: 'Disabled' })).not.toBeChecked()
    expect(main().getByRole('group', { name: 'Button preview' })).not.toHaveClass('dark')
  })

  it('does not carry a half-typed value to the next example', async () => {
    const user = userEvent.setup()
    await renderRoute('/playground?example=data-table')
    const field = within(controls()).getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field)
    await user.paste('500')
    expect(within(controls()).getByRole('alert')).toBeInTheDocument()

    await user.click(within(examples()).getByRole('link', { name: 'Dialog' }))
    await waitFor(() => {
      expect(main().getByRole('heading', { level: 2, name: 'Dialog' })).toBeInTheDocument()
    })
    expect(within(controls()).queryByRole('alert')).toBeNull()

    await user.click(within(examples()).getByRole('link', { name: 'Data table' }))
    await waitFor(() => {
      expect(main().getByRole('heading', { level: 2, name: 'Data table' })).toBeInTheDocument()
    })
    expect(within(controls()).getByRole('spinbutton', { name: 'Rows per page' })).toHaveValue(5)
  })

  it('shows the Dialog inside its frame, opens it, and closes it with Escape', async () => {
    const user = userEvent.setup()
    await renderRoute('/playground?example=dialog')
    const frame = main().getByRole('group', { name: 'Dialog preview' })
    const trigger = within(frame).getByRole('button', { name: 'Open dialog' })

    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Delete this component?' })
    expect(frame).toContainElement(dialog)

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(trigger).toHaveFocus()
  })

  it('does not change the page theme when the preview theme changes', async () => {
    const user = userEvent.setup()
    await renderRoute('/playground')
    const before = document.documentElement.className
    await user.click(main().getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement.className).toBe(before)
    expect(main().getByRole('group', { name: 'Button preview' })).toHaveClass('dark')
  })
})
