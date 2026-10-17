import { data, replace, type LoaderFunctionArgs } from 'react-router'

import {
  experimentHref,
  experimentKinds,
  getExperiment,
  getExperimentKind,
} from '@/content/experiments'
import { getNote } from '@/content/notes'
import { getProjectEntry } from '@/content/project-entries'
import { getTemplate } from '@/content/templates'
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

function notFound(suggestions: NotFoundData['suggestions'] = []): never {
  const body: NotFoundData = { suggestions }
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Router renders thrown data as a route error response.
  throw data(body, { status: 404, statusText: 'Not Found' })
}

function slugParam(params: LoaderFunctionArgs['params'], key = 'slug'): string {
  return params[key] ?? ''
}

export function noteLoader({ params }: LoaderFunctionArgs) {
  return getNote(slugParam(params)) ?? notFound()
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
