import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { renderSettled } from '@/test/render'

import { parseMarkdown } from './markdown'
import { MarkdownView } from './markdown-view'

function page(source: string) {
  const doc = parseMarkdown(`# Title\n\n${source}`)
  return (
    <MemoryRouter>
      <MarkdownView blocks={doc.blocks} />
    </MemoryRouter>
  )
}

function view(source: string) {
  return render(page(source))
}

/** For a page with an example, which loads its code after the first render. */
function viewSettled(source: string) {
  return renderSettled(page(source))
}

describe('MarkdownView', () => {
  it('renders headings with their ids and a link to each section', () => {
    view('## First {#first}\n\n### Nested\n\n#### Deeper\n')
    expect(screen.getByRole('heading', { level: 2, name: 'First' })).toHaveAttribute('id', 'first')
    expect(screen.getByRole('heading', { level: 3, name: 'Nested' })).toHaveAttribute(
      'id',
      'nested',
    )
    expect(screen.getByRole('heading', { level: 4, name: 'Deeper' })).toHaveAttribute(
      'id',
      'deeper',
    )
    expect(screen.getByRole('link', { name: 'Link to section: First' })).toHaveAttribute(
      'href',
      '#first',
    )
  })

  it('renders emphasis, code, and line breaks inside a paragraph', () => {
    const { container } = view('A **bold**, *italic*, ~~gone~~ and `code` line  \nnext.\n')
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('del')).toHaveTextContent('gone')
    expect(container.querySelector('code')).toHaveTextContent('code')
    expect(container.querySelector('br')).not.toBeNull()
  })

  it('renders a site link with the router, a heading link in place, and an external link in a new tab', () => {
    view('[docs](/docs/installation), [here](#there), and [out](https://example.com/x).\n')
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', '/docs/installation')
    expect(screen.getByRole('link', { name: 'docs' })).not.toHaveAttribute('target')
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute('href', '#there')
    const external = screen.getByRole('link', { name: /^out/ })
    expect(external).toHaveAttribute('href', 'https://example.com/x')
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAccessibleName('out (opens in a new tab)')
  })

  it('renders unordered and ordered lists, the latter from its start number', () => {
    const { container } = view('- one\n- two\n\n3. three\n4. four\n')
    expect(screen.getAllByRole('list')).toHaveLength(2)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(container.querySelector('ol')).toHaveAttribute('start', '3')
  })

  it('renders a quote and a rule', () => {
    const { container } = view('> Quoted.\n\n---\n')
    expect(container.querySelector('blockquote')).toHaveTextContent('Quoted.')
    expect(container.querySelector('hr')).not.toBeNull()
  })

  it('renders a table with column headers, alignment, and inline content', () => {
    view('| Name | Count |\n| --- | ---: |\n| `a` | **2** |\n')
    const table = screen.getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Name', 'Count'])
    expect(within(table).getByRole('cell', { name: '2' })).toHaveClass('text-right')
    expect(within(table).getByText('a').tagName).toBe('CODE')
  })

  it.each([
    ['NOTE', 'Note'],
    ['TIP', 'Tip'],
    ['IMPORTANT', 'Important'],
    ['CAUTION', 'Caution'],
  ])('renders [!%s] as a note titled "%s", which is not announced as an alert', (kind, title) => {
    view(`> [!${kind}]\n> Read this **carefully**.\n`)
    const note = screen.getByRole('note')
    expect(within(note).getByText(title)).toBeInTheDocument()
    expect(note).toHaveTextContent('Read this carefully.')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows a construct the docs do not support as a note, as the author typed it', () => {
    view('Before\n\n<div>raw</div>\n\nAfter with <b>inline</b>.\n')
    const notes = screen.getAllByRole('note')
    expect(notes[0]).toHaveTextContent('raw HTML is not supported: <div>raw</div>')
    expect(screen.getByText(/After with/)).toHaveTextContent('After with <b>inline</b>.')
    // Never turned into elements.
    expect(document.querySelector('b')).toBeNull()
  })

  it('does not decode entities or interpret HTML in text', () => {
    view('Tom &amp; <script>alert(1)</script>\n')
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByText(/Tom &amp;/)).toBeInTheDocument()
  })
})

describe('MarkdownView code blocks', () => {
  it('names each copy button after the block and copies the code exactly', async () => {
    // Created before rendering: the copy button checks for the clipboard when it mounts.
    const user = userEvent.setup()
    view(
      [
        '```bash title="install"',
        'pnpm add clsx',
        '```',
        '',
        '```tsx title="src/main.tsx"',
        "import { createRoot } from 'react-dom/client'",
        '```',
      ].join('\n'),
    )
    expect(screen.getByText('install')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Copy src/main.tsx' }))
    expect(await navigator.clipboard.readText()).toBe(
      "import { createRoot } from 'react-dom/client'",
    )
    await user.click(screen.getByRole('button', { name: 'Copy install' }))
    expect(await navigator.clipboard.readText()).toBe('pnpm add clsx')
  })

  it('numbers the copy buttons of blocks that share a title', () => {
    userEvent.setup()
    view('```bash title="run"\na\n```\n\n```bash title="run"\nb\n```\n')
    expect(screen.getByRole('button', { name: 'Copy run' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy run (2)' })).toBeInTheDocument()
  })

  it('highlights a typescript block once the grammar has loaded', async () => {
    const { container } = view('```ts title="a.ts"\nconst a = 1\n```\n')
    await waitFor(() => {
      expect(container.querySelector('.shiki')).not.toBeNull()
    })
  })

  it('shows an unknown language as plain text', () => {
    const { container } = view('```python title="a.py"\nprint(1)\n```\n')
    expect(container.querySelector('pre')).toHaveTextContent('print(1)')
    expect(container.querySelector('.shiki')).toBeNull()
  })
})

describe('MarkdownView directives', () => {
  it('shows the props of a registry entry from its metadata', () => {
    view('::registry-api{slug="button" part="Button"}\n')
    const table = screen.getByRole('table', { name: 'Button props' })
    expect(within(table).getByRole('rowheader', { name: 'variant' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute(
      'href',
      '/components/button#api',
    )
  })

  it('lists the implemented entries of a category with their status and exports', () => {
    view('::registry-index{kind="component" category="actions"}\n')
    const row = screen.getByRole('row', { name: /^Button/ })
    expect(within(row).getByRole('rowheader', { name: 'Button' })).toBeInTheDocument()
    expect(within(row).getByText('Stable')).toBeInTheDocument()
    // The exports column lists the parts the entry documents.
    expect(within(row).getByRole('cell', { name: 'Button' })).toBeInTheDocument()
  })

  it('shows a live example with its code once its content has loaded', async () => {
    await viewSettled('::registry-example{slug="badge" example="variants"}\n')
    expect(await screen.findByRole('tab', { name: 'Preview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Code' })).toBeInTheDocument()
  })

  it('shows an allow-listed repository file', () => {
    view('::source{path="src/lib/cn.ts"}\n')
    expect(screen.getByText('src/lib/cn.ts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy src/lib/cn.ts' })).toBeInTheDocument()
  })

  it('shows a group of design tokens from the stylesheet', async () => {
    view('::design-tokens{group="radius"}\n')
    const table = await screen.findByRole('table', { name: 'Radius tokens' })
    expect(within(table).getByRole('rowheader', { name: '--radius' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: '--radius-sm' })).toBeInTheDocument()
    expect(within(table).getByText('Small corners (rounded-sm)')).toBeInTheDocument()
  })

  it('shows the theme switcher', () => {
    view('::theme-switcher\n')
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  })

  it.each([
    ['::registry-api{slug="nope"}', 'There is no implemented registry entry "nope".'],
    ['::registry-api{slug="button" part="Gone"}', '"button" documents no part named "Gone".'],
    ['::registry-example{slug="badge" example="gone"}', '"badge" has no example "gone".'],
    ['::registry-index{category="nope"}', '"nope" is not a registry category.'],
    [
      '::source{path="src/main.tsx"}',
      '"src/main.tsx" is not in the list of files a page may show.',
    ],
  ])('replaces %s with a note instead of failing', async (directive, message) => {
    await viewSettled(`${directive}\n`)
    // An example's note appears once the entry's content has loaded and has no such example.
    const note = await screen.findByRole('note')
    expect(note).toHaveTextContent(message)
    expect(note).toHaveTextContent(/^Cannot show ::/)
  })

  it('replaces a malformed directive with a note that says why', () => {
    view('::registry-api{slug=button}\n')
    expect(screen.getByRole('note')).toHaveTextContent(/cannot read attributes/)
  })
})
