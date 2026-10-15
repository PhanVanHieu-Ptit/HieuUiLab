import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { booleanControl, defineControls, numberControl } from '../controls'
import { definePlaygroundExample, type StageProps } from '../example'
import { getPlaygroundExample } from '..'
import { Workbench } from './workbench'

function example(id: string) {
  const found = getPlaygroundExample(id)
  if (!found) throw new Error(`No example "${id}"`)
  return found
}

function setup(id: string) {
  // Created before rendering: the copy button checks for the clipboard when it mounts.
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <Workbench example={example(id)} />
    </MemoryRouter>,
  )
  return user
}

const preview = (name: string) => screen.getByRole('group', { name: `${name} preview` })
const controls = () => within(screen.getByRole('form', { name: 'Example controls' }))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Workbench controls change the real preview', () => {
  it('an enum select changes the component and the code', async () => {
    const user = setup('button')
    const button = within(preview('Button')).getByRole('button', { name: 'Save changes' })
    expect(button.className).not.toContain('bg-destructive')

    await user.selectOptions(controls().getByRole('combobox', { name: 'Variant' }), 'destructive')

    expect(within(preview('Button')).getByRole('button').className).toContain('bg-destructive')
    expect(document.body).toHaveTextContent('variant="destructive"')
  })

  it('a segmented size changes the component', async () => {
    const user = setup('button')
    const before = within(preview('Button')).getByRole('button').className
    await user.click(controls().getByRole('radio', { name: 'lg' }))
    expect(controls().getByRole('radio', { name: 'lg' })).toBeChecked()
    expect(within(preview('Button')).getByRole('button').className).not.toBe(before)
    expect(within(preview('Button')).getByRole('button').className).toContain('h-10')
  })

  it('a switch changes the component', async () => {
    const user = setup('button')
    const button = () => within(preview('Button')).getByRole('button')
    expect(button()).not.toBeDisabled()
    await user.click(controls().getByRole('switch', { name: 'Loading' }))
    expect(button()).toBeDisabled()
    expect(button()).toHaveAttribute('aria-busy', 'true')
  })

  it('a text field changes the label as it is typed', async () => {
    const user = setup('input')
    const field = controls().getByRole('textbox', { name: 'Placeholder' })
    await user.clear(field)
    await user.type(field, 'Search…')
    expect(within(preview('Input')).getByRole('textbox')).toHaveAttribute('placeholder', 'Search…')
  })

  it('a number field changes the data table', async () => {
    const user = setup('data-table')
    expect(screen.getByText('1–5 of 12 deployments')).toBeInTheDocument()
    const field = controls().getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field)
    await user.type(field, '9')
    expect(screen.getByText('1–9 of 12 deployments')).toBeInTheDocument()
    expect(document.body).toHaveTextContent('defaultPageSize={9}')
  })

  it('a flag adds a column of checkboxes to the data table', async () => {
    const user = setup('data-table')
    expect(within(preview('Data table')).queryByRole('checkbox')).toBeNull()
    await user.click(controls().getByRole('switch', { name: 'Row selection' }))
    expect(within(preview('Data table')).getAllByRole('checkbox').length).toBeGreaterThan(1)
  })
})

describe('Workbench handles invalid values safely', () => {
  it('refuses a number outside its range, says why, and keeps the last good value', async () => {
    const user = setup('data-table')
    const field = controls().getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field)
    await user.paste('500')

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(controls().getByRole('alert')).toHaveTextContent('Enter a whole number from 1 to 100.')
    expect(field).toHaveAccessibleDescription(/Enter a whole number from 1 to 100/)
    // The table still shows the last valid page size.
    expect(screen.getByText('1–5 of 12 deployments')).toBeInTheDocument()

    await user.tab()
    expect(controls().queryByRole('alert')).toBeNull()
    expect(field).toHaveValue(5)
  })

  it('refuses an empty or fractional number', async () => {
    const user = setup('data-table')
    const field = controls().getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field)
    expect(controls().getByRole('alert')).toBeInTheDocument()
    await user.paste('2.5')
    expect(controls().getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('1–5 of 12 deployments')).toBeInTheDocument()
  })

  it('accepts each valid value on the way to an invalid one', async () => {
    const user = setup('data-table')
    const field = controls().getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field)
    await user.type(field, '500')
    // 5 and 50 were valid, so the table kept the last of them; 500 is refused.
    expect(controls().getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('1–12 of 12 deployments')).toBeInTheDocument()
    await user.tab()
    expect(field).toHaveValue(50)
  })

  it('does not refill a required text field while it is being retyped', async () => {
    const user = setup('button')
    const field = controls().getByRole('textbox', { name: 'Label' })
    await user.clear(field)

    expect(field).toHaveValue('')
    expect(controls().getByRole('alert')).toHaveTextContent('Enter some text.')
    // The button keeps its last good label rather than going blank.
    expect(within(preview('Button')).getByRole('button', { name: 'Save changes' })).toBeVisible()

    await user.type(field, 'Go')
    expect(controls().queryByRole('alert')).toBeNull()
    expect(within(preview('Button')).getByRole('button', { name: 'Go' })).toBeVisible()
  })

  it('puts the committed value back when a required field is left blank', async () => {
    const user = setup('button')
    const field = controls().getByRole('textbox', { name: 'Label' })
    await user.clear(field)
    await user.tab()
    expect(field).toHaveValue('Save changes')
  })

  it('cleans text a field is given: no direction overrides, bounded length', async () => {
    const user = setup('badge')
    const field = controls().getByRole('textbox', { name: 'Label' })
    await user.clear(field)
    await user.paste('ab\u202Ecd')
    expect(within(preview('Badge')).getByText('abcd')).toBeInTheDocument()
    await user.clear(field)
    await user.paste('x'.repeat(500))
    expect(within(preview('Badge')).getByText('x'.repeat(120))).toBeInTheDocument()
  })
})

describe('Workbench theme and width', () => {
  it('scopes the theme to the preview frame only', async () => {
    const user = setup('badge')
    const frame = () => preview('Badge')
    expect(frame()).not.toHaveClass('dark')
    expect(frame()).not.toHaveClass('light')

    await user.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(frame()).toHaveClass('dark')
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    expect(frame()).toHaveClass('light')
    expect(frame()).not.toHaveClass('dark')
    await user.click(screen.getByRole('radio', { name: 'Site' }))
    expect(frame()).not.toHaveClass('light')

    // Never the page itself.
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement).not.toHaveClass('light')
  })

  it('resizes the frame and says what that does not do', async () => {
    const user = setup('badge')
    expect(preview('Badge')).toHaveClass('w-full')
    expect(screen.queryByText(/still follow your browser window/)).toBeNull()

    await user.click(screen.getByRole('radio', { name: 'Mobile 375px' }))
    expect(preview('Badge')).toHaveClass('w-[375px]')
    expect(screen.getByText(/still follow your browser window/)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Tablet 768px' }))
    expect(preview('Badge')).toHaveClass('w-[768px]')

    await user.click(screen.getByRole('radio', { name: 'Full' }))
    expect(preview('Badge')).toHaveClass('w-full')
  })
})

describe('Workbench reset', () => {
  it('restores the controls, theme, and width to the defaults', async () => {
    const user = setup('button')
    await user.selectOptions(controls().getByRole('combobox', { name: 'Variant' }), 'ghost')
    await user.click(controls().getByRole('radio', { name: 'lg' }))
    await user.click(controls().getByRole('switch', { name: 'Disabled' }))
    await user.click(screen.getByRole('radio', { name: 'Dark' }))
    await user.click(screen.getByRole('radio', { name: 'Mobile 375px' }))
    const label = controls().getByRole('textbox', { name: 'Label' })
    await user.clear(label)
    await user.type(label, 'Other')

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(controls().getByRole('combobox', { name: 'Variant' })).toHaveValue('default')
    expect(controls().getByRole('radio', { name: 'md' })).toBeChecked()
    expect(controls().getByRole('switch', { name: 'Disabled' })).not.toBeChecked()
    expect(controls().getByRole('textbox', { name: 'Label' })).toHaveValue('Save changes')
    expect(screen.getByRole('radio', { name: 'Site' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Full' })).toBeChecked()
    expect(preview('Button')).not.toHaveClass('dark')
    expect(preview('Button')).toHaveClass('w-full')
    const button = within(preview('Button')).getByRole('button', { name: 'Save changes' })
    expect(button).toBeEnabled()
    expect(screen.getByText(/^Reset to the default configuration/)).toBeInTheDocument()
  })

  it('also clears a draft that was never accepted', async () => {
    const user = setup('data-table')
    const field = () => controls().getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field())
    await user.paste('500')
    expect(controls().getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(controls().queryByRole('alert')).toBeNull()
    expect(field()).toHaveValue(5)
    expect(field()).not.toHaveAttribute('aria-invalid')
  })

  it('clears a draft even when pressing Reset does not move focus out of the field', async () => {
    const user = setup('data-table')
    const field = () => controls().getByRole('spinbutton', { name: 'Rows per page' })
    await user.clear(field())
    await user.paste('500')
    expect(field()).toHaveFocus()

    // Some assistive technology activates a button without moving focus, so no blur clears it.
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(controls().queryByRole('alert')).toBeNull()
    expect(field()).toHaveValue(5)
  })

  it('keeps focus on the button, and can be pressed repeatedly', async () => {
    const user = setup('badge')
    const reset = screen.getByRole('button', { name: 'Reset' })
    await user.click(reset)
    expect(reset).toHaveFocus()
    expect(reset).toBeEnabled()
    const announcement = () => screen.getByText(/^Reset to the default configuration/).textContent
    const first = announcement()
    await user.click(reset)
    // The text differs each time, so a screen reader announces every press.
    expect(announcement()).not.toBe(first)
  })
})

describe('Workbench copy actions', () => {
  it('copies the usage example exactly as shown', async () => {
    const user = setup('button')
    await user.click(controls().getByRole('radio', { name: 'sm' }))
    await user.selectOptions(controls().getByRole('combobox', { name: 'Variant' }), 'outline')

    await user.click(screen.getByRole('button', { name: 'Copy usage example' }))

    expect(await navigator.clipboard.readText()).toBe(
      [
        "import { Button } from '@/components/ui/button'",
        '',
        'export function ButtonExample() {',
        '  return <Button variant="outline" size="sm">Save changes</Button>',
        '}',
        '',
      ].join('\n'),
    )
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
  })

  it('copies the current configuration as JSON', async () => {
    const user = setup('button')
    await user.selectOptions(controls().getByRole('combobox', { name: 'Variant' }), 'ghost')
    await user.click(screen.getByRole('radio', { name: 'Dark' }))

    await user.click(screen.getByRole('button', { name: 'Copy configuration' }))

    expect(JSON.parse(await navigator.clipboard.readText())).toEqual({
      example: 'button',
      controls: {
        children: 'Save changes',
        variant: 'ghost',
        size: 'md',
        loading: false,
        disabled: false,
      },
      theme: 'dark',
      viewport: 'full',
    })
  })
})

describe('Workbench keyboard use', () => {
  it('moves through the theme options with the arrow keys', async () => {
    const user = setup('badge')
    screen.getByRole('radio', { name: 'Site' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus()
    expect(preview('Badge')).toHaveClass('light')
    await user.keyboard('{ArrowRight}')
    expect(preview('Badge')).toHaveClass('dark')
    await user.keyboard('{ArrowLeft}')
    expect(preview('Badge')).toHaveClass('light')
  })

  it('toggles a switch with Space', async () => {
    const user = setup('button')
    controls().getByRole('switch', { name: 'Loading' }).focus()
    await user.keyboard(' ')
    expect(within(preview('Button')).getByRole('button')).toBeDisabled()
    await user.keyboard(' ')
    expect(within(preview('Button')).getByRole('button')).toBeEnabled()
  })

  it('reaches every control, the toolbar, and the copy buttons with Tab alone', async () => {
    const user = setup('data-table')
    const reachable = new Set<string>()
    for (let step = 0; step < 80; step += 1) {
      await user.tab()
      const active = document.activeElement
      if (!(active instanceof HTMLElement)) continue
      const name = active.getAttribute('aria-label') ?? active.textContent
      reachable.add(`${active.tagName.toLowerCase()}:${active.getAttribute('role') ?? ''}:${name}`)
    }
    const names = [...reachable].join('\n')
    for (const expected of [
      'Reset',
      'Copy usage example',
      'Copy configuration',
      'input::',
      'button:switch:',
    ]) {
      expect(names).toContain(expected)
    }
  })

  it('does not submit when Enter is pressed in a text field', async () => {
    const user = setup('badge')
    const field = controls().getByRole('textbox', { name: 'Label' })
    const submit = vi.fn()
    screen.getByRole('form', { name: 'Example controls' }).addEventListener('submit', submit)
    await user.click(field)
    await user.keyboard('{Enter}')
    // The page does not navigate or reload; the field keeps its value.
    expect(field).toHaveValue('Beta')
  })
})

describe('Workbench with an example that throws', () => {
  const schema = defineControls({
    explode: booleanControl({ label: 'Explode', default: false }),
    count: numberControl({ label: 'Count', default: 1, min: 1, max: 3, integer: true }),
  })
  const fragile = definePlaygroundExample({
    id: 'fragile',
    title: 'Fragile',
    description: 'Throws on request.',
    controls: schema,
    resolve: (values) => values,
    Stage: ({ config }: StageProps<{ explode: boolean; count: number }>) => {
      if (config.explode) throw new Error('boom')
      return <p>Fine {config.count}</p>
    },
    code: () => 'export const fragile = true\n',
  })

  it('contains the failure, and recovers on the next change', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Workbench example={fragile} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Fine 1')).toBeInTheDocument()

    await user.click(controls().getByRole('switch', { name: 'Explode' }))
    expect(screen.getByRole('alert')).toHaveTextContent('This demo couldn’t load')
    // The rest of the page still works.
    expect(controls().getByRole('switch', { name: 'Explode' })).toBeInTheDocument()

    await user.click(controls().getByRole('switch', { name: 'Explode' }))
    expect(screen.getByText('Fine 1')).toBeInTheDocument()
    expect(screen.queryByText('This demo couldn’t load')).toBeNull()
  })
})
