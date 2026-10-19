import { beforeAll, describe, expect, it } from 'vitest'

import { createNotesContext } from '@/test/notes-context'

import { notes } from './manifest'
import { validateNotes, type NotesContext } from './notes-rules'

let context: NotesContext

beforeAll(async () => {
  context = await createNotesContext()
})

// The articles are checked against the repository: the code they quote, the files they cite, the
// links they follow, and the commands they name. Run it alone with `pnpm notes:check`.
describe('the engineering notes', () => {
  it('follow every notes rule', () => {
    expect(validateNotes(context)).toEqual([])
  })

  it('have an article loaded for every entry in the manifest', () => {
    expect(context.articles.map(({ entry }) => entry.slug)).toEqual(notes.map((note) => note.slug))
  })

  it('are listed newest first', () => {
    const dates = notes.map((note) => note.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })
})
