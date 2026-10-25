import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

/**
 * Moves focus to the new page's heading when the path changes. A link that is followed unmounts
 * with the page it was on, which drops focus to the document: the next Tab starts again from the
 * top, and a screen reader says nothing about the new page. The heading is what a reader would look
 * for first, so it is where focus goes, without scrolling (the router restores scroll itself).
 *
 * Not on the first load, where the skip link is the first Tab stop; not when only the search or the
 * hash changes, so typing in a filter keeps focus in it; and not when the URL names a fragment,
 * which is the reader's chosen place on the page.
 */
export function RouteFocus() {
  const { pathname, hash } = useLocation()
  const shown = useRef(pathname)

  useEffect(() => {
    if (shown.current === pathname) return
    shown.current = pathname
    if (hash !== '') return
    const main = document.getElementById('main')
    const target = main?.querySelector<HTMLElement>('h1') ?? main
    if (!target) return
    // A heading is not focusable until it has a tabindex; -1 keeps it out of the Tab order.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }, [pathname, hash])

  return null
}
