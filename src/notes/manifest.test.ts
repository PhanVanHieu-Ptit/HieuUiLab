import { describe, expect, it } from 'vitest'

import {
  filterNotes,
  getNote,
  isNoteTag,
  noteFile,
  noteHref,
  noteTagCounts,
  relatedNotes,
  type NoteEntry,
} from './manifest'

function note(slug: string, overrides: Partial<NoteEntry> = {}): NoteEntry {
  return {
    slug,
    title: slug,
    summary: `About ${slug}.`,
    date: '2026-10-01',
    tags: ['react'],
    evidence: [{ label: 'Example', path: 'src/example.ts' }],
    load: () => Promise.resolve({ default: '' }),
    ...overrides,
  }
}

describe('lookups', () => {
  const list = [note('a'), note('b')]

  it('finds an article by slug', () => {
    expect(getNote('b', list)?.slug).toBe('b')
    expect(getNote('missing', list)).toBeUndefined()
  })

  it('builds the URL and the source path from the slug', () => {
    expect(noteHref({ slug: 'a' })).toBe('/notes/a')
    expect(noteFile({ slug: 'a' })).toBe('src/notes/content/a.md')
  })

  it('recognises only tags in the vocabulary', () => {
    expect(isNoteTag('react')).toBe(true)
    expect(isNoteTag('React')).toBe(false)
    expect(isNoteTag('')).toBe(false)
  })
})

describe('tags', () => {
  const list = [
    note('a', { tags: ['react', 'forms'] }),
    note('b', { tags: ['react'] }),
    note('c', { tags: ['testing'] }),
  ]

  it('counts the tags in use, in the order of the vocabulary', () => {
    expect(noteTagCounts(list)).toEqual([
      { tag: 'forms', count: 1 },
      { tag: 'react', count: 2 },
      { tag: 'testing', count: 1 },
    ])
  })

  it('filters by a tag', () => {
    expect(filterNotes('react', list).map((item) => item.slug)).toEqual(['a', 'b'])
    expect(filterNotes('testing', list).map((item) => item.slug)).toEqual(['c'])
  })

  it('leaves the list alone for an empty, missing, or unknown tag', () => {
    for (const tag of ['', null, undefined, 'not-a-tag']) {
      expect(filterNotes(tag, list), String(tag)).toBe(list)
    }
  })

  it('returns nothing for a tag no article carries', () => {
    expect(filterNotes('registry', list)).toEqual([])
  })
})

describe('relatedNotes', () => {
  it('ranks an explicit link above a shared tag', () => {
    const list = [
      note('current', { tags: ['react'], related: ['linked'] }),
      note('tagged', { tags: ['react'], date: '2026-10-05' }),
      note('linked', { tags: ['testing'] }),
    ]
    expect(relatedNotes('current', 3, list).map((item) => item.slug)).toEqual(['linked', 'tagged'])
  })

  it('counts a link in either direction', () => {
    const list = [note('a', { tags: ['react'] }), note('b', { tags: ['testing'], related: ['a'] })]
    expect(relatedNotes('a', 3, list).map((item) => item.slug)).toEqual(['b'])
    expect(relatedNotes('b', 3, list).map((item) => item.slug)).toEqual(['a'])
  })

  it('adds one point for each shared tag', () => {
    const list = [
      note('current', { tags: ['react', 'forms', 'testing'] }),
      note('one', { tags: ['react'], date: '2026-10-09' }),
      note('two', { tags: ['react', 'forms'], date: '2026-10-01' }),
    ]
    expect(relatedNotes('current', 3, list).map((item) => item.slug)).toEqual(['two', 'one'])
  })

  it('leaves out an article that shares nothing', () => {
    const list = [note('a', { tags: ['react'] }), note('b', { tags: ['testing'] })]
    expect(relatedNotes('a', 3, list)).toEqual([])
  })

  it('never lists the article itself', () => {
    const list = [note('a', { related: ['a'] }), note('b')]
    expect(relatedNotes('a', 3, list).map((item) => item.slug)).toEqual(['b'])
  })

  it('breaks ties by the newer date, then by slug, whatever the order of the list', () => {
    const base = note('current', { tags: ['react'] })
    const newer = note('zeta', { date: '2026-10-09' })
    const olderA = note('alpha', { date: '2026-10-02' })
    const olderB = note('beta', { date: '2026-10-02' })
    const expected = ['zeta', 'alpha', 'beta']
    expect(relatedNotes('current', 3, [base, olderB, olderA, newer]).map((n) => n.slug)).toEqual(
      expected,
    )
    expect(relatedNotes('current', 3, [newer, olderA, olderB, base]).map((n) => n.slug)).toEqual(
      expected,
    )
  })

  it('stops at the limit', () => {
    const list = [note('a'), note('b'), note('c'), note('d')]
    expect(relatedNotes('a', 2, list)).toHaveLength(2)
  })

  it('returns nothing for an unknown slug', () => {
    expect(relatedNotes('missing', 3, [note('a')])).toEqual([])
  })
})
