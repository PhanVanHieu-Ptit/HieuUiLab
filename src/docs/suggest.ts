import { editDistance } from '@/registry/catalog'

import { docNodes } from './manifest'

export interface DocSuggestion {
  title: string
  href: string
}

/**
 * Pages that best match an unknown docs path, for "did you mean" links on a 404: a slug within a
 * few edits of the last segment, or a title, description, or keyword sharing a word with the path.
 */
export function suggestDocs(path: string, limit = 3): DocSuggestion[] {
  const needle = (path.split('/').filter(Boolean).at(-1) ?? '').toLowerCase()
  const words = path
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
  const scored = docNodes.flatMap((node) => {
    const { slug, title, description, keywords = [] } = node.entry
    if (slug === '') return []
    const distance = editDistance(needle, slug)
    const close = distance <= Math.max(2, Math.floor(slug.length / 3))
    const searchable = `${title} ${description} ${keywords.join(' ')}`.toLowerCase()
    const shared = words.some((word) => searchable.includes(word))
    return close || shared ? [{ node, distance }] : []
  })
  return scored
    .sort((a, b) => a.distance - b.distance || a.node.entry.title.localeCompare(b.node.entry.title))
    .slice(0, limit)
    .map(({ node }) => ({ title: node.entry.title, href: node.href }))
}
