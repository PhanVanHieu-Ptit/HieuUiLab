import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  filterNotes,
  getNote,
  noteHref,
  noteTagCounts,
  notes,
  relatedNotes,
} from '@/notes/manifest'
import { requiredSections } from '@/notes/notes-rules'
import { renderRoute } from '@/test/render'

// Tests read the manifest, so adding an article does not break them. A tag that is on some
// articles but not all of them is what makes a filter observable.
const filterable = noteTagCounts().find(({ count }) => count < notes.length)

function articleList() {
  return screen.getByRole('list', { name: 'Articles' })
}

function listedTitles(): string[] {
  return within(articleList())
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
}

describe('the notes index', () => {
  it('lists every article, newest first, under an h2 each', async () => {
    await renderRoute('/notes')
    expect(screen.getByRole('heading', { level: 1, name: 'Engineering notes' })).toBeInTheDocument()
    expect(listedTitles()).toEqual(notes.map((note) => note.title))
  })

  it('links each card to its article', async () => {
    await renderRoute('/notes')
    for (const note of notes) {
      expect(screen.getByRole('link', { name: note.title })).toHaveAttribute('href', noteHref(note))
    }
  })

  it('offers one toggle per tag in use, with how many articles carry it', async () => {
    await renderRoute('/notes')
    const group = screen.getByRole('group', { name: 'Tags' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(
      noteTagCounts().map(({ tag, count }) => `${tag} (${String(count)})`),
    )
    for (const button of buttons) expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent(`${String(notes.length)} articles`)
  })

  it('filters by a tag, keeps the choice in the URL, and clears it', async () => {
    if (!filterable) throw new Error('Some tag must be on some articles, but not all of them')
    const { tag, count } = filterable
    const user = userEvent.setup()
    const { router } = await renderRoute('/notes')

    await user.click(screen.getByRole('button', { name: `${tag} (${String(count)})` }))
    expect(router.state.location.search).toBe(`?tag=${tag}`)
    expect(listedTitles()).toEqual(filterNotes(tag).map((note) => note.title))
    expect(screen.getByRole('button', { name: `${tag} (${String(count)})` })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      `${String(count)} articles of ${String(notes.length)} tagged ${tag}`,
    )

    await user.click(screen.getByRole('button', { name: 'Show all articles' }))
    expect(router.state.location.search).toBe('')
    expect(listedTitles()).toHaveLength(notes.length)
  })

  it('turns a tag off when its toggle is pressed again', async () => {
    if (!filterable) throw new Error('Some tag must be on some articles, but not all of them')
    const name = `${filterable.tag} (${String(filterable.count)})`
    const user = userEvent.setup()
    await renderRoute('/notes')
    await user.click(screen.getByRole('button', { name }))
    await user.click(screen.getByRole('button', { name }))
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
    expect(listedTitles()).toHaveLength(notes.length)
  })

  it('opens already filtered when the URL names a tag', async () => {
    if (!filterable) throw new Error('Some tag must be on some articles, but not all of them')
    await renderRoute(`/notes?tag=${filterable.tag}`)
    expect(listedTitles()).toHaveLength(filterable.count)
    expect(
      screen.getByRole('button', { name: `${filterable.tag} (${String(filterable.count)})` }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('ignores a tag that is not in the vocabulary', async () => {
    await renderRoute('/notes?tag=not-a-tag')
    expect(listedTitles()).toHaveLength(notes.length)
    for (const button of within(screen.getByRole('group', { name: 'Tags' })).getAllByRole(
      'button',
    )) {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
  })
})

describe.each(notes.map((note) => [note.slug, note.title] as const))(
  'the article %s',
  (slug, title) => {
    it('renders one h1 and every section of the template, in order', async () => {
      await renderRoute(`/notes/${slug}`)
      const main = screen.getByRole('main')
      expect(within(main).getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(within(main).getByRole('heading', { level: 1, name: title })).toBeInTheDocument()

      const sections = within(main)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent)
      const positions = requiredSections.map((section) => sections.indexOf(section))
      expect(positions.every((position) => position >= 0)).toBe(true)
      expect(positions).toEqual([...positions].sort((a, b) => a - b))
      // A construct that failed would show a note saying so in place of the content.
      expect(within(main).queryByText(/^Cannot show|^Not supported in docs/)).toBeNull()
    })

    it('gives every copy button its own name', async () => {
      await renderRoute(`/notes/${slug}`)
      const names = screen
        .getAllByRole('button', { name: /^Copy / })
        .map((button) => button.ariaLabel)
      expect(new Set(names).size).toBe(names.length)
    })

    it('names the files its claims rest on', async () => {
      await renderRoute(`/notes/${slug}`)
      const entry = getNote(slug)
      const evidence = screen.getByRole('region', { name: 'Evidence in the repository' })
      for (const item of entry?.evidence ?? []) {
        expect(within(evidence).getByText(item.path)).toBeInTheDocument()
      }
    })

    it('lists related articles, each a link to another article', async () => {
      await renderRoute(`/notes/${slug}`)
      const related = relatedNotes(slug)
      expect(related.length).toBeGreaterThan(0)
      const section = screen.getByRole('region', { name: 'Related articles' })
      expect(
        within(section)
          .getAllByRole('heading', { level: 3 })
          .map((heading) => heading.textContent),
      ).toEqual(related.map((note) => note.title))
    })
  },
)

describe('an article page', () => {
  it('shows when it was written and when it was last checked', async () => {
    const note = getNote('theme-without-flash')
    await renderRoute('/notes/theme-without-flash')
    const main = screen.getByRole('main')
    expect(main.querySelector(`time[datetime="${note?.date ?? ''}"]`)).not.toBeNull()
    expect(main.querySelector(`time[datetime="${note?.updated ?? ''}"]`)).not.toBeNull()
  })

  it('links each tag to the list filtered by it', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/notes/theme-without-flash')
    const link = screen.getByRole('link', { name: 'Articles tagged theming' })
    expect(link).toHaveAttribute('href', '/notes?tag=theming')

    await user.click(link)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/notes')
    })
    expect(router.state.location.search).toBe('?tag=theming')
    expect(screen.getByRole('button', { name: /^theming \(/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('follows a related article', async () => {
    const user = userEvent.setup()
    const [first] = relatedNotes('theme-without-flash')
    if (!first) throw new Error('theme-without-flash must have a related article')
    const { router } = await renderRoute('/notes/theme-without-flash')
    const section = screen.getByRole('region', { name: 'Related articles' })
    await user.click(within(section).getByRole('link', { name: first.title }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(noteHref(first))
    })
  })

  it('scrolls to the heading a fragment names when the page is opened directly', async () => {
    // A direct load renders the layout first and the lazy page later, with the location unchanged.
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    scrollIntoView.mockClear()
    await renderRoute('/notes/theme-without-flash#verification')
    await waitFor(() => {
      expect(scrollIntoView.mock.contexts).toContain(document.getElementById('verification'))
    })
    expect(document.getElementById('verification')).toHaveTextContent('Verification')
  })
})
