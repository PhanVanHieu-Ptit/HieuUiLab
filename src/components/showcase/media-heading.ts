import type { ShowcaseMedia } from '@/content/showcase-types'

/** What the section is called, from what it holds. Links alone are "Explore it", not a demo. */
export function mediaHeading(media: readonly ShowcaseMedia[]): string {
  const live = media.some((item) => item.kind === 'lab-demo' || item.kind === 'registry-example')
  const shots = media.some((item) => item.kind === 'screenshot')
  if (live && shots) return 'Live demos and screenshots'
  if (live) return 'Live demos'
  if (shots) return 'Screenshots'
  return 'Explore it'
}
