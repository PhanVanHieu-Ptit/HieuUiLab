import { useEffect, useRef } from 'react'
import { useLocation, useMatches } from 'react-router'

function targetOf(hash: string): HTMLElement | null {
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)))
  } catch {
    // A malformed escape in the URL names no element.
    return null
  }
}

/**
 * Scrolls to the heading a URL's `#fragment` names when the page is opened directly.
 *
 * The browser looks for the fragment as the document loads, before this app has rendered the
 * page, and the router scrolls only when the location changes. On a direct load, a refresh, or a
 * link followed from outside, the page renders later, so nothing would scroll. This waits for the
 * element to exist, scrolls once, and then leaves the scroll position to the reader.
 */
export function ScrollToHash() {
  const { hash, key } = useLocation()
  // Subscribes to the matched routes and their loader data. When a lazy page finishes loading, the
  // location is unchanged, so without this nothing would render this component again and the
  // effect would never see the page. (`useNavigation` is not enough: it stays "idle" throughout.)
  useMatches()
  const scrolledFor = useRef<string | null>(null)

  // After every render, until the target exists: lazy pages arrive after the layout.
  useEffect(() => {
    if (hash === '' || scrolledFor.current === key) return
    const target = targetOf(hash)
    if (!target) return
    scrolledFor.current = key
    target.scrollIntoView()
  })

  return null
}
