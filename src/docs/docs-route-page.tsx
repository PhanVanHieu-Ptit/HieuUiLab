import { useLoaderData } from 'react-router'

import type { DocLoaderData } from '@/router/loaders'

import { DocsPage } from './docs-page'
import { findDocById } from './manifest'

/** The component of every docs route: the page the loader fetched the Markdown for. */
export function DocsRoutePage() {
  const { id, source } = useLoaderData<DocLoaderData>()
  const node = findDocById(id)
  // The loader took the id from the manifest, so a page is always found.
  if (!node) return null
  return <DocsPage node={node} source={source} />
}
