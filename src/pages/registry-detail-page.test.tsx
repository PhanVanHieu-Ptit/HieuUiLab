import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getImplementedEntry } from '@/registry'
import type { ImplementedEntry } from '@/registry/types'
import { importStatement, playgroundCode } from '@/registry/usage'
import { registryDetailAnchors } from '@/test/docs-context'
import { renderRoute } from '@/test/render'

function entry(slug: string): ImplementedEntry {
  const found = getImplementedEntry(slug)
  if (!found) throw new Error(`No implemented entry "${slug}"`)
  return found
}

function playground() {
  return screen.getByRole('region', { name: 'Playground' })
}

/** The live component inside the playground preview. */
function previewed(role: 'button' | 'switch') {
  return within(screen.getByRole('group', { name: /preview$/ })).getByRole(role)
}

describe('RegistryDetailPage', () => {
  it('renders the Button entry with examples, installation, and API', async () => {
    await renderRoute('/components/button')

    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Variants' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Button props' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Category and tags' })).toHaveTextContent('Actions')
    expect(screen.getByRole('link', { name: 'cn helper' })).toHaveAttribute(
      'href',
      '/docs/installation#cn',
    )
    expect(
      screen.getByText(
        'pnpm add class-variance-authority clsx lucide-react radix-ui tailwind-merge',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('aria-current', 'page')
  })

  it('lists usage guidelines with inline code in the Usage tab, before the installation steps', async () => {
    await renderRoute('/components/tooltip')

    const code = screen.getByRole('region', { name: 'Code' })
    const usage = within(code).getByRole('tabpanel', { name: 'Usage' })
    const guidelines = within(usage).getByRole('list', { name: 'Guidelines' })
    expect(within(guidelines).getAllByRole('listitem').length).toBeGreaterThan(1)
    expect(within(guidelines).getByText('aria-label', { selector: 'code' })).toBeInTheDocument()

    const installation = screen.getByRole('region', { name: 'Installation' })
    expect(code.compareDocumentPosition(installation) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('omits the guidelines for entries without them', async () => {
    await renderRoute('/components/kbd')
    expect(screen.getByRole('tabpanel', { name: 'Usage' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Guidelines' })).not.toBeInTheDocument()
  })

  it('switches a demo from Preview to Code', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/button')

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

  it('shows a not-found message for an unknown slug', async () => {
    await renderRoute('/components/qwxz-zzyq')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Suggestions' })).toBeNull()
  })

  it('suggests close entries for a mistyped slug', async () => {
    await renderRoute('/components/buton')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    const suggestions = screen.getByRole('navigation', { name: 'Suggestions' })
    expect(within(suggestions).getByRole('link', { name: 'Button' })).toHaveAttribute(
      'href',
      '/components/button',
    )
  })

  it('documents each part of a multi-part API', async () => {
    await renderRoute('/components/dialog')
    expect(screen.getByRole('table', { name: 'Dialog props' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'DialogContent props' })).toBeInTheDocument()
  })

  it('renders a planned entry without code or install steps', async () => {
    await renderRoute('/components/combobox')
    expect(screen.getByRole('heading', { level: 1, name: 'Combobox' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Not implemented yet' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Planned scope' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Installation' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Code' })).toBeNull()
    const related = screen.getByRole('region', { name: 'Related' })
    expect(within(related).getByRole('link', { name: 'Select' })).toHaveAttribute(
      'href',
      '/components/select',
    )
  })

  it('renders a block with links to the registry entries it needs', async () => {
    await renderRoute('/blocks/resource-list')

    expect(screen.getByRole('heading', { level: 1, name: 'Resource list' })).toBeInTheDocument()
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Blocks' })).toHaveAttribute(
      'href',
      '/blocks',
    )
    const requires = screen.getByText(/Also copy these registry entries first/)
    expect(
      within(requires)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual([
      '/blocks/empty-state',
      '/components/button',
      '/blocks/error-state',
      '/components/skeleton',
    ])
  })

  it('redirects an entry requested under another category to its own page', async () => {
    const { router } = await renderRoute('/components/resource-list')
    expect(router.state.location.pathname).toBe('/blocks/resource-list')
    expect(screen.getByRole('heading', { level: 1, name: 'Resource list' })).toBeInTheDocument()
  })
})

describe('RegistryDetailPage breadcrumbs', () => {
  it('links the category to the catalog filtered by it', async () => {
    await renderRoute('/components/button')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(trail).getByRole('link', { name: 'Actions' })).toHaveAttribute(
      'href',
      '/components?category=actions',
    )
    expect(within(trail).getByText('Button')).toHaveAttribute('aria-current', 'page')
  })
})

describe('RegistryDetailPage playground', () => {
  it('updates the real component and the code from the controls', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/button')
    const controls = within(playground()).getByRole('form', { name: 'Playground controls' })

    expect(previewed('button')).toHaveTextContent('Save changes')
    expect(previewed('button')).not.toHaveAttribute('aria-busy')

    const label = within(controls).getByRole('textbox', { name: 'Label' })
    await user.clear(label)
    await user.type(label, 'Publish')
    await user.selectOptions(within(controls).getByRole('combobox', { name: 'Variant' }), [
      'destructive',
    ])
    await user.click(within(controls).getByRole('switch', { name: 'Loading' }))

    const button = previewed('button')
    expect(button).toHaveTextContent('Publish')
    expect(button).toHaveClass('bg-destructive')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()

    await user.click(within(playground()).getByRole('tab', { name: 'Code' }))
    expect(within(playground()).getByRole('tabpanel', { name: 'Code' })).toHaveTextContent(
      '<Button variant="destructive" loading>Publish</Button>',
    )
  })

  it('resets to the defaults and hides Reset when nothing changed', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/button')
    expect(within(playground()).queryByRole('button', { name: 'Reset' })).toBeNull()

    await user.selectOptions(within(playground()).getByRole('combobox', { name: 'Size' }), ['lg'])
    await user.click(within(playground()).getByRole('button', { name: 'Reset' }))

    expect(within(playground()).getByRole('combobox', { name: 'Size' })).toHaveValue('md')
    expect(within(playground()).queryByRole('button', { name: 'Reset' })).toBeNull()
  })

  it('applies initial-state props such as defaultChecked', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/switch')
    expect(previewed('switch')).not.toBeChecked()

    await user.click(within(playground()).getByRole('switch', { name: 'Checked by default' }))

    expect(previewed('switch')).toBeChecked()
    expect(previewed('switch')).toHaveAccessibleName('Email notifications')
  })

  it('copies exactly the code for the current controls', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/badge')
    await user.selectOptions(within(playground()).getByRole('combobox', { name: 'Variant' }), [
      'success',
    ])
    await user.click(within(playground()).getByRole('tab', { name: 'Code' }))
    await user.click(screen.getByRole('button', { name: 'Copy playground code' }))

    const expected = playgroundCode(entry('badge'), {
      children: 'Beta',
      variant: 'success',
      size: 'md',
    })
    expect(expected).toContain('<Badge variant="success">Beta</Badge>')
    expect(await navigator.clipboard.readText()).toBe(expected)
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
  })

  it('is not shown for entries without supported controls', async () => {
    await renderRoute('/components/dialog')
    expect(screen.queryByRole('region', { name: 'Playground' })).toBeNull()
    expect(screen.queryByRole('form', { name: 'Playground controls' })).toBeNull()
  })
})

describe('RegistryDetailPage code tabs', () => {
  it('moves between Usage and Source with the arrow keys', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/kbd')
    const code = screen.getByRole('region', { name: 'Code' })
    const usage = within(code).getByRole('tab', { name: 'Usage' })
    expect(usage).toHaveAttribute('aria-selected', 'true')

    usage.focus()
    await user.keyboard('{ArrowRight}')

    const source = within(code).getByRole('tab', { name: 'Source' })
    expect(source).toHaveFocus()
    expect(source).toHaveAttribute('aria-selected', 'true')
    expect(within(code).getByRole('tabpanel', { name: 'Source' })).toHaveTextContent(
      'export function Kbd',
    )
  })

  it('opens the Source tab from the installation step', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/kbd')
    await user.click(screen.getByRole('link', { name: 'Source tab' }))
    expect(screen.getByRole('tab', { name: 'Source' })).toHaveAttribute('aria-selected', 'true')
  })

  it('shows an import of every documented export', async () => {
    await renderRoute('/components/tabs')
    expect(screen.getByRole('tabpanel', { name: 'Usage' })).toHaveTextContent(
      importStatement(entry('tabs')),
    )
  })
})

describe('RegistryDetailPage copy actions', () => {
  it('copies the import, the install command, and the source', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/button')
    const button = entry('button')

    await user.click(screen.getByRole('button', { name: 'Copy import' }))
    expect(await navigator.clipboard.readText()).toBe(
      "import { Button } from '@/components/ui/button'",
    )

    await user.click(screen.getByRole('button', { name: 'Copy install command' }))
    expect(await navigator.clipboard.readText()).toBe(
      'pnpm add class-variance-authority clsx lucide-react radix-ui tailwind-merge',
    )

    await user.click(screen.getByRole('tab', { name: 'Source' }))
    await user.click(screen.getByRole('button', { name: 'Copy button.tsx' }))
    expect(await navigator.clipboard.readText()).toBe(button.source)
  })

  it('hides copy buttons where the clipboard API is unavailable', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    try {
      await renderRoute('/components/button')
      expect(screen.queryByRole('button', { name: /^Copy / })).toBeNull()
      expect(screen.getByRole('tabpanel', { name: 'Usage' })).toHaveTextContent(
        "import { Button } from '@/components/ui/button'",
      )
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })
})

describe('RegistryDetailPage dependencies and related entries', () => {
  it('lists packages with versions, registry entries, and dependents', async () => {
    await renderRoute('/components/button')
    const dependencies = screen.getByRole('region', { name: 'Dependencies' })
    const packages = within(dependencies).getByRole('table', { name: 'npm packages' })
    const row = within(packages).getByRole('row', { name: /radix-ui/ })
    expect(row).toHaveTextContent(/~?\^?\d+\.\d+/)

    expect(within(dependencies).getByText('None')).toBeInTheDocument()
    expect(within(dependencies).getByRole('link', { name: 'Confirm action' })).toHaveAttribute(
      'href',
      '/blocks/confirm-action',
    )
  })

  it('separates direct registry dependencies from those reached through them', async () => {
    await renderRoute('/blocks/resource-list')
    const dependencies = screen.getByRole('region', { name: 'Dependencies' })
    expect(within(dependencies).getByText(/and through them/)).toBeInTheDocument()
    expect(within(dependencies).getByText('No other entries')).toBeInTheDocument()
  })

  it('links related entries with the reason they are related', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components/button')
    const related = screen.getByRole('list', { name: 'Related entries' })
    expect(within(related).getByText('Uses Button · Also in Actions')).toBeInTheDocument()

    await user.click(within(related).getByRole('link', { name: 'Confirm action' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Confirm action' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/blocks/confirm-action')
  })
})

describe('RegistryDetailPage section anchors', () => {
  // The docs link to these ids (for example /components/button#api), and validateDocs trusts the
  // list in src/test/docs-context.ts. This keeps the list true.
  it.each(['/components/button', '/blocks/data-table'])(
    '%s has a section for every anchor the docs may link to',
    async (path) => {
      await renderRoute(path)
      for (const id of registryDetailAnchors) {
        expect(document.getElementById(id), id).not.toBeNull()
      }
    },
  )
})
