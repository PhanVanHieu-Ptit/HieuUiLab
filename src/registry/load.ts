import { registry } from '.'
import type { ImplementedEntry, ImplementedEntryContent, LoadedEntry } from './types'
import { assertValidEntryContent } from './validate'

const loaded = new Map<string, Promise<ImplementedEntryContent>>()
const bySlug = new Map(registry.map((entry) => [entry.slug, entry]))

/**
 * An entry's source, examples, and playground. The promise is cached so an entry is fetched once and
 * React's `use` gets the same promise on every render; a failed load is forgotten so a retry works.
 */
export function loadEntryContent(entry: ImplementedEntry): Promise<ImplementedEntryContent> {
  const cached = loaded.get(entry.slug)
  if (cached) return cached
  const promise = entry
    .content()
    .then(({ content }) => {
      // Dev only: the content is checked against the metadata on the page that loads it.
      if (import.meta.env.DEV) assertValidEntryContent({ ...entry, ...content }, bySlug)
      return content
    })
    .catch((error: unknown) => {
      loaded.delete(entry.slug)
      throw error
    })
  loaded.set(entry.slug, promise)
  return promise
}

/** The entry with its content, as the detail page and the generators use it. */
export async function loadEntry(entry: ImplementedEntry): Promise<LoadedEntry> {
  return { ...entry, ...(await loadEntryContent(entry)) }
}
