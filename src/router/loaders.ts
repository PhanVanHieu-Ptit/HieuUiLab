import { data, replace, type LoaderFunctionArgs } from 'react-router'

import type { DocEntry } from '@/docs/manifest'
import { suggestDocs } from '@/docs/suggest'
import {
  experimentHref,
  experimentKinds,
  getExperiment,
  getExperimentKind,
} from '@/content/experiments'
import { getProjectEntry } from '@/content/project-entries'
import { getTemplate } from '@/content/templates'
import { getNote, type NoteEntry } from '@/notes/manifest'
import { getRegistryEntry, registry, registryHref } from '@/registry'
import { suggestEntries } from '@/registry/catalog'
import type { RegistryKind } from '@/registry/types'

// Loaders only look up local, typed content. They run before a lazy page chunk
// downloads, so unknown slugs resolve to a 404 and moved URLs redirect without it.
// Redirects use `replace` so the old URL does not stay in history (Back would bounce).

/** Data thrown with a 404; the not-found page offers these links. */
export interface NotFoundData {
  suggestions: readonly { title: string; href: string }[]
}

export function notFound(suggestions: NotFoundData['suggestions'] = []): never {
  const body: NotFoundData = { suggestions }
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Router renders thrown data as a route error response.
  throw data(body, { status: 404, statusText: 'Not Found' })
}

function slugParam(params: LoaderFunctionArgs['params'], key = 'slug'): string {
  return params[key] ?? ''
}

/** What a note's loader returns: its manifest entry and its Markdown text. */
export interface NoteLoaderData {
  entry: NoteEntry
  source: string
}

/**
 * A note's Markdown, fetched here for the same reason a docs page's is: the text is there on the
 * first render, so a link to `/notes/<slug>#heading` can scroll to a heading that exists. Parsing
 * waits for the page chunk, which keeps the Markdown parser out of the main bundle.
 */
export async function noteLoader({ params }: LoaderFunctionArgs): Promise<NoteLoaderData> {
  const entry = getNote(slugParam(params)) ?? notFound()
  return { entry, source: (await entry.load()).default }
}

export function projectLoader({ params }: LoaderFunctionArgs) {
  return getProjectEntry(slugParam(params)) ?? notFound()
}

export function templateLoader({ params }: LoaderFunctionArgs) {
  return getTemplate(slugParam(params)) ?? notFound()
}

/**
 * An entry of `kind`; a slug of the other kind redirects to its own page, and an
 * unknown slug is a 404 that suggests the closest entries.
 */
export function registryLoader(kind: RegistryKind) {
  return ({ params }: LoaderFunctionArgs) => {
    const slug = slugParam(params)
    const entry = getRegistryEntry(slug, kind)
    if (entry) return entry
    const elsewhere = getRegistryEntry(slug)
    if (elsewhere) return replace(registryHref(elsewhere))
    return notFound(
      suggestEntries(registry, slug).map((suggestion) => ({
        title: suggestion.name,
        href: registryHref(suggestion),
      })),
    )
  }
}

/** What a docs page's loader returns: the page's id and its Markdown text. */
export interface DocLoaderData {
  id: string
  source: string
}

/**
 * A docs page's Markdown. Fetching it here, not in the page, means the text is there on the first
 * render, so a link with a `#heading` can scroll to a heading that exists. Parsing waits for the
 * page chunk, which keeps the Markdown parser out of the main bundle.
 */
export function docLoader(entry: DocEntry) {
  return async (): Promise<DocLoaderData> => ({
    id: entry.id,
    source: (await entry.load()).default,
  })
}

/** An unknown path under `/docs`: a 404 that suggests the closest pages. */
export function docNotFoundLoader({ params }: LoaderFunctionArgs): never {
  return notFound(suggestDocs(params['*'] ?? ''))
}

/** Route id of `/labs/:kind`; its category page reads this route's loader data. */
export const LAB_KIND_ROUTE_ID = 'lab-kind'

export function experimentKindLoader({ params }: LoaderFunctionArgs) {
  return getExperimentKind(slugParam(params, 'kind')) ?? notFound()
}

/** An experiment; one requested under the wrong category redirects to its own URL. */
export function experimentLoader({ params }: LoaderFunctionArgs) {
  const experiment = getExperiment(slugParam(params)) ?? notFound()
  if (experimentKinds[experiment.kind].path !== params.kind) {
    return replace(experimentHref(experiment))
  }
  return experiment
}

/** `/lab/:slug` moved to `/labs/:kind/:slug`. */
export function legacyLabLoader({ params }: LoaderFunctionArgs) {
  const experiment = getExperiment(slugParam(params)) ?? notFound()
  return replace(experimentHref(experiment))
}
