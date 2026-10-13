import { vi } from 'vitest'

/**
 * Spy on window.matchMedia so `matching` queries match; undo with vi.restoreAllMocks.
 * Returns a function that updates `matching` and fires a change event for every listener.
 */
export function mockMatchMedia(matching: (query: string) => boolean) {
  const listeners = new Set<() => void>()
  let matches = matching

  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return matches(query)
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      }) as unknown as MediaQueryList,
  )

  return function change(next: (query: string) => boolean) {
    matches = next
    listeners.forEach((listener) => {
      listener()
    })
  }
}

export const prefersReducedMotion = (query: string) => query.includes('prefers-reduced-motion')
