import { useEffect } from 'react'

import { useRouteMeta } from '@/router/meta'

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

/**
 * Keeps the document title and description meta in sync with the route.
 * Client-side only: crawlers that do not run JavaScript see index.html's defaults.
 */
export function RouteMetadata() {
  const { documentTitle, description, noindex } = useRouteMeta()

  useEffect(() => {
    document.title = documentTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', documentTitle)
    setMeta('property', 'og:description', description)
    if (noindex) {
      setMeta('name', 'robots', 'noindex')
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove()
    }
  }, [documentTitle, description, noindex])

  return null
}
