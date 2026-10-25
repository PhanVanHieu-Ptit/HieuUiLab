import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { sourceExports } from '@/registry/usage'
import { isImplemented } from '@/registry/types'
import { fullRegistry } from '@/test/full-registry'

import { defaultValues } from './controls'
import { validatePlaygroundExamples, type PlaygroundExample } from './example'
import { getPlaygroundExample, playgroundExamples } from '.'

function example(id: string): PlaygroundExample {
  const found = getPlaygroundExample(id)
  if (!found) throw new Error(`No example "${id}"`)
  return found
}

function renderStage(
  id: string,
  raw: Record<string, unknown> = {},
  portalContainer: HTMLElement | null = null,
) {
  const target = example(id)
  const resolved = target.resolve(raw)
  const { Stage } = target
  const view = render(<Stage config={resolved.config} portalContainer={portalContainer} />)
  return { resolved, ...view }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the allowlist', () => {
  it('lists the five examples in order', () => {
    expect(playgroundExamples.map((each) => each.id)).toEqual([
      'button',
      'input',
      'badge',
      'dialog',
      'data-table',
    ])
  })

  it('is sound: unique kebab-case ids, text, controls, and code at the defaults', () => {
    expect(validatePlaygroundExamples(playgroundExamples)).toEqual([])
  })

  it('finds an example by exact id and nothing else', () => {
    expect(getPlaygroundExample('dialog')?.title).toBe('Dialog')
    for (const id of [
      'nope',
      '',
      ' dialog',
      'Dialog',
      'dialog ',
      '__proto__',
      'constructor',
      'toString',
      'length',
      '0',
      null,
      undefined,
    ]) {
      expect(getPlaygroundExample(id), String(id)).toBeUndefined()
    }
  })

  it('reports problems in a bad set', () => {
    const [first] = playgroundExamples
    const problems = validatePlaygroundExamples([
      first,
      first,
      { ...first, id: 'Not Kebab', title: ' ' },
    ])
    expect(problems).toEqual(
      expect.arrayContaining([
        `${first.id}: the id is used more than once`,
        'Not Kebab: the id is not kebab-case',
        'Not Kebab: the title is empty',
      ]),
    )
  })
})

describe('every example', () => {
  it.each(playgroundExamples.map((each) => [each.id, each] as const))(
    '%s renders at its defaults without errors, and its code is not empty',
    (id) => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const { container, resolved } = renderStage(id)
      expect(container.firstElementChild).not.toBeNull()
      expect(resolved.code).toContain('export function')
      expect(error).not.toHaveBeenCalled()
      expect(warn).not.toHaveBeenCalled()
    },
  )

  it.each(playgroundExamples.map((each) => [each.id, each] as const))(
    '%s resolves untrusted input to its defaults',
    (_id, each) => {
      const defaults = defaultValues(each.controls)
      const hostile = Object.fromEntries(
        Object.keys(each.controls).map((key) => [key, { toString: () => 'x' }]),
      )
      expect(each.resolve(hostile).values).toEqual(defaults)
      expect(each.resolve({}).values).toEqual(defaults)
      const polluted = JSON.parse('{"__proto__": {"x": 1}}') as Record<string, unknown>
      expect(each.resolve(polluted).values).toEqual(defaults)
    },
  )

  it.each(playgroundExamples.map((each) => [each.id, each] as const))(
    '%s generates code that imports only names its module really exports',
    (_id, each) => {
      const code = each.resolve({}).code
      const imports = [...code.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)]
      const projectImports = imports.filter(([, , from]) => from?.startsWith('@/'))
      expect(projectImports.length).toBeGreaterThan(0)
      for (const [, names = '', from = ''] of projectImports) {
        const entry = fullRegistry
          .filter(isImplemented)
          .find(
            (candidate) => `@/${candidate.installation.targetPath}`.replace(/\.tsx$/, '') === from,
          )
        expect(entry, `a registry entry provides ${from}`).toBeDefined()
        if (!entry) continue
        const exported = sourceExports(entry.source)
        for (const name of names.split(',').map((part) => part.trim().replace(/^type\s+/, ''))) {
          if (name) expect(exported.has(name), `${from} exports ${name}`).toBe(true)
        }
      }
    },
  )
})

describe('the registry examples', () => {
  it('Button shows the props the controls set, and the code says the same', () => {
    const { resolved } = renderStage('button', {
      children: 'Remove',
      variant: 'destructive',
      size: 'lg',
      loading: true,
    })
    const button = screen.getByRole('button', { name: 'Remove' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(resolved.code).toContain(
      '<Button variant="destructive" size="lg" loading>Remove</Button>',
    )
  })

  it('Button never has a blank label', () => {
    expect(example('button').resolve({ children: '   ' }).values.children).toBe('Save changes')
  })

  it('Input shows the invalid and disabled states', () => {
    const { resolved } = renderStage('input', {
      placeholder: 'name@example.com',
      'aria-invalid': true,
      disabled: true,
      size: 'lg',
    })
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('placeholder', 'name@example.com')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toBeDisabled()
    expect(resolved.code).toContain('aria-invalid')
  })

  it('Badge shows its label', () => {
    const { resolved } = renderStage('badge', { children: 'New', variant: 'success', size: 'sm' })
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(resolved.code).toContain('<Badge variant="success" size="sm">New</Badge>')
  })

  it('text that JSX would decode is written so the code matches the preview', () => {
    const { resolved } = renderStage('badge', { children: 'R&amp;D' })
    expect(screen.getByText('R&amp;D')).toBeInTheDocument()
    expect(resolved.code).toContain('{"R&amp;D"}')
  })

  it('uses the registry definitions: same controls, same defaults', () => {
    for (const slug of ['button', 'input', 'badge']) {
      const entry = fullRegistry.filter(isImplemented).find((candidate) => candidate.slug === slug)
      const controls = entry?.playground?.controls ?? []
      const shown = example(slug)
      expect(Object.keys(shown.controls)).toEqual(controls.map((control) => control.prop))
      expect(defaultValues(shown.controls)).toEqual(
        Object.fromEntries(controls.map((control) => [control.prop, control.default])),
      )
    }
  })

  it('links to the component documentation', () => {
    expect(example('button').docsHref).toBe('/components/button')
    expect(example('badge').docsHref).toBe('/components/badge')
  })
})

describe('the Dialog example', () => {
  it('opens a dialog named by the title and described by the description', async () => {
    const user = userEvent.setup()
    renderStage('dialog', { title: 'Archive project?', description: 'It can be restored later.' })
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog', { name: 'Archive project?' })
    expect(dialog).toHaveAccessibleDescription('It can be restored later.')
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('leaves the description out, and says so, when it is blank', async () => {
    const user = userEvent.setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { resolved } = renderStage('dialog', { description: '   ' })
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(resolved.code).not.toContain('DialogDescription')
    expect(resolved.code).toContain('aria-describedby={undefined}')
    // Older Radix versions warn when a dialog has neither a description nor this opt-out; the
    // installed one does not, so this guards against a regression rather than proving the opt-out.
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('can hide the close button, and the code says so', async () => {
    const user = userEvent.setup()
    const { resolved } = renderStage('dialog', { showClose: false })
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull()
    expect(resolved.code).toContain('showClose={false}')
  })

  it('uses the chosen confirm label and style', async () => {
    const user = userEvent.setup()
    const { resolved } = renderStage('dialog', { confirmLabel: 'Keep', confirmVariant: 'default' })
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Keep' })).toBeInTheDocument()
    expect(resolved.code).toContain('<Button>Keep</Button>')
    expect(resolved.code).not.toContain('variant="destructive"')
  })

  it('renders inside the element it is given, but never writes that into the code', async () => {
    const user = userEvent.setup()
    const host = document.createElement('div')
    document.body.append(host)
    try {
      const { resolved } = renderStage('dialog', {}, host)
      await user.click(screen.getByRole('button', { name: 'Open dialog' }))
      const dialog = await screen.findByRole('dialog')
      expect(host).toContainElement(dialog)
      expect(resolved.code).not.toContain('container')
    } finally {
      host.remove()
    }
  })

  it('closes with Escape and returns focus to its trigger', async () => {
    const user = userEvent.setup()
    renderStage('dialog')
    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('wraps long titles the way Prettier would, within 100 columns', () => {
    const { code } = example('dialog').resolve({
      title: 'x'.repeat(80),
      description: 'y'.repeat(200),
    })
    for (const line of code.split('\n')) {
      // A single unbroken string may be long; a line with tags must not be.
      if (line.includes('<')) expect(line.length, line).toBeLessThanOrEqual(100)
    }
    expect(code).toContain(`<DialogTitle>\n`)
  })
})

describe('the DataTable example', () => {
  function rows() {
    return within(screen.getByRole('table')).getAllByRole('row')
  }

  it('shows a page of sample rows under a visible caption', () => {
    renderStage('data-table')
    expect(screen.getByRole('table', { name: 'Recent deployments' })).toBeInTheDocument()
    // The header row and the first page of five.
    expect(rows()).toHaveLength(6)
    expect(screen.getByText('1–5 of 12 deployments')).toBeInTheDocument()
  })

  it('pages by the chosen number of rows', () => {
    renderStage('data-table', { pageSize: 8 })
    expect(rows()).toHaveLength(9)
    expect(screen.getByText('1–8 of 12 deployments')).toBeInTheDocument()
  })

  it('shows every row when the page is large enough', () => {
    renderStage('data-table', { rows: 40, pageSize: 100 })
    expect(rows()).toHaveLength(41)
  })

  it('shows the empty state for zero rows', () => {
    renderStage('data-table', { rows: 0 })
    expect(screen.getByText('No deployments yet')).toBeInTheDocument()
  })

  it('shows the loading and error states', () => {
    const view = renderStage('data-table', { state: 'loading' })
    expect(screen.getByRole('status')).toHaveTextContent('Loading deployments')
    view.unmount()
    renderStage('data-table', { state: 'error' })
    expect(screen.getByText('The deployments service did not respond.')).toBeInTheDocument()
  })

  it('has sortable columns only when asked', () => {
    const view = renderStage('data-table', { sortable: true })
    const headers = () => within(screen.getByRole('table')).queryAllByRole('button')
    expect(headers().map((button) => button.textContent)).toEqual(['Service', 'Status', 'Duration'])
    view.unmount()
    renderStage('data-table', { sortable: false })
    expect(headers()).toHaveLength(0)
  })

  it('sorts when a header is activated', async () => {
    const user = userEvent.setup()
    renderStage('data-table', { rows: 8, pageSize: 8 })
    await user.click(screen.getByRole('button', { name: 'Service' }))
    expect(screen.getByRole('columnheader', { name: 'Service' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    const first = within(rows()[1] ?? document.body).getAllByRole('rowheader')
    expect(first[0]).toHaveTextContent('admin')
  })

  it('selects rows only when asked, and keeps the count', async () => {
    const user = userEvent.setup()
    const view = renderStage('data-table', { selectable: false })
    expect(screen.queryByRole('checkbox')).toBeNull()
    view.unmount()

    renderStage('data-table', { selectable: true })
    await user.click(screen.getByRole('checkbox', { name: 'Select checkout-api (d1)' }))
    expect(screen.getByText(/1 selected/)).toBeInTheDocument()
  })

  it('writes code that matches the configuration', () => {
    const base = example('data-table').resolve({})
    expect(base.code).toContain('label="Recent deployments"')
    expect(base.code).toContain('showCaption')
    expect(base.code).toContain('defaultPageSize={5}')
    expect(base.code).toContain("state={{ status: 'ready', items: deployments }}")
    expect(base.code).toContain('sortValue: (row) => row.service,')
    expect(base.code).not.toContain('useState')
    expect(base.code).toContain('// The preview uses 12 sample rows; the first 3 are shown.')

    const plain = example('data-table').resolve({
      label: 'Builds',
      showCaption: false,
      pageSize: 25,
      sortable: false,
      selectable: true,
      state: 'error',
      rows: 2,
    })
    expect(plain.code).toContain('label="Builds"')
    expect(plain.code).not.toContain('showCaption')
    expect(plain.code).not.toContain('defaultPageSize')
    expect(plain.code).not.toContain('sortValue')
    expect(plain.code).toContain("import { useState } from 'react'")
    expect(plain.code).toContain('selectedIds,')
    expect(plain.code).toContain(
      "state={{ status: 'error', message: 'The deployments service did not respond.' }}",
    )
    expect(plain.code).not.toContain('The preview uses')

    const loading = example('data-table').resolve({ state: 'loading' }).code
    expect(loading).toContain("state={{ status: 'loading' }}")
    // Sample rows nothing refers to are not written out.
    expect(loading).not.toContain('const deployments')
    expect(plain.code).not.toContain('const deployments')
    expect(example('data-table').resolve({ rows: 0 }).code).toContain(
      'const deployments: readonly Deployment[] = []',
    )
  })

  it('lists the same columns in the code as the table shows', () => {
    renderStage('data-table', { sortable: true })
    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent)
    const code = example('data-table').resolve({}).code
    for (const header of headers) expect(code).toContain(`header: '${header}'`)
  })

  it('keeps every line of the code within 100 columns', () => {
    const code = example('data-table').resolve({
      label: 'x'.repeat(60),
      selectable: true,
      pageSize: 99,
    }).code
    for (const line of code.split('\n')) expect(line.length, line).toBeLessThanOrEqual(100)
  })
})
