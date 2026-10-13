import { useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', listener)
  return () => {
    query.removeEventListener('change', listener)
  }
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * Whether the user asked the OS to minimise motion. CSS animations are already
 * cut by a global rule; use this for motion driven from JavaScript.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
