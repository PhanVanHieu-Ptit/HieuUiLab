import { buttonEntry } from './button/meta'
import type { RegistryEntry } from './types'

export const registry: readonly RegistryEntry[] = [buttonEntry]

export function getRegistryEntry(slug: string): RegistryEntry | undefined {
  return registry.find((entry) => entry.slug === slug)
}
