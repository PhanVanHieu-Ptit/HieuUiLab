import { registry } from '@/registry'
import { loadEntry } from '@/registry/load'
import { isImplemented, type FullRegistryEntry, type LoadedEntry } from '@/registry/types'

/**
 * Every entry with its source, examples, and playground loaded, through the same loaders the app
 * uses. The app never holds this list; tests and generators that read the content do. The top-level
 * await keeps their own code synchronous.
 */
export const fullRegistry: readonly FullRegistryEntry[] = await Promise.all(
  registry.map(async (entry) => (isImplemented(entry) ? await loadEntry(entry) : entry)),
)

/** An implemented entry with its content, or undefined for an unknown slug or a planned entry. */
export function getLoadedEntry(slug: string, kind?: LoadedEntry['kind']): LoadedEntry | undefined {
  return fullRegistry
    .filter(isImplemented)
    .find((entry) => entry.slug === slug && (kind === undefined || entry.kind === kind))
}
