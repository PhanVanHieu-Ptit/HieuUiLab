import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeAll, describe, expect, it } from 'vitest'

import { DocsPage } from './docs-page'
import { findDocById, type DocNode } from './manifest'

function node(id: string): DocNode {
  const found = findDocById(id)
  if (!found) throw new Error(`No docs page ${id}`)
  return found
}

function page(id: string, source: string) {
  return render(
    <MemoryRouter>
      <DocsPage node={node(id)} source={source} />
    </MemoryRouter>,
  )
}

const longSource = [
  '# Installation',
  '',
  '## First',
  '',
  'Text.',
  '',
  '### Nested',
  '',
  'Text.',
  '',
  '#### Too deep for the contents',
  '',
  'Text.',
  '',
  '## Second',
  '',
  'Text.',
].join('\n')

describe('DocsPage', () => {
  let installation: string
  beforeAll(async () => {
    installation = (await node('installation').entry.load()).default
  })

  it('has one h1, the page title, with its group and description above the text', () => {
    page('installation', longSource)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Installation' })).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(
      screen.getByText('Copy a component into your project, with its dependencies and tokens.'),
    ).toBeInTheDocument()
  })

  it('does not repeat the file title as a second heading', () => {
    page('installation', longSource)
    expect(screen.getAllByRole('heading', { name: 'Installation' })).toHaveLength(1)
  })

  it('lists the h2 and h3 headings in "On this page", linked by id', () => {
    page('installation', longSource)
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(
      within(toc)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['First', 'Nested', 'Second'])
    expect(within(toc).getByRole('link', { name: 'Nested' })).toHaveAttribute('href', '#nested')
    // The heading the link points at exists.
    expect(document.getElementById('nested')).toHaveTextContent('Nested')
  })

  it('puts the contents before the text in the document', () => {
    page('installation', longSource)
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const first = screen.getByRole('heading', { level: 2, name: 'First' })
    expect(toc.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('leaves out the contents for a short page', () => {
    page('installation', '# Installation\n\n## Only\n\nText.\n\n## Two\n\nText.\n')
    expect(screen.queryByRole('navigation', { name: 'On this page' })).toBeNull()
  })

  it('links to the previous and next pages in reading order', () => {
    page('installation', longSource)
    const pager = screen.getByRole('navigation', { name: 'Docs pager' })
    expect(within(pager).getByRole('link', { name: /Getting started/ })).toHaveAttribute(
      'href',
      '/docs',
    )
    expect(
      within(pager).getByRole('link', { name: /Install with the shadcn CLI/ }),
    ).toHaveAttribute('href', '/docs/shadcn-registry')
  })

  it('has only a next link on the first page and only a previous link on the last', () => {
    page('getting-started', '# Getting started\n\n## A\n\nText.\n')
    let pager = screen.getByRole('navigation', { name: 'Docs pager' })
    expect(within(pager).getAllByRole('link')).toHaveLength(1)
    expect(within(pager).getByRole('link')).toHaveAccessibleName(/^Next/)
    document.body.replaceChildren()
    page('changelog', '# Changelog\n\n## Unreleased\n\n- A change.\n')
    pager = screen.getByRole('navigation', { name: 'Docs pager' })
    expect(within(pager).getAllByRole('link')).toHaveLength(1)
    expect(within(pager).getByRole('link')).toHaveAccessibleName(/^Previous/)
  })

  it('names the Markdown file the page comes from', () => {
    page('changelog', '# Changelog\n\n## Unreleased\n\n- A change.\n')
    expect(screen.getByText('CHANGELOG.md')).toBeInTheDocument()
    document.body.replaceChildren()
    page('installation', longSource)
    expect(screen.getByText('src/docs/content/installation.md')).toBeInTheDocument()
  })

  it('renders the real Installation page with a copy button per code block', () => {
    // The copy button only mounts where a clipboard exists, which user-event installs.
    userEvent.setup()
    page('installation', installation)
    expect(screen.getByRole('button', { name: 'Copy add the fonts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy src/main.tsx' })).toBeInTheDocument()
    expect(document.getElementById('cn')).toHaveTextContent('Add the cn helper')
    expect(document.getElementById('tokens')).toHaveTextContent('Add the tokens')
  })
})
