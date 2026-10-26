import { getTransformedRoutes, type GetRoutesProps, type Route } from '@vercel/routing-utils'
import { matchRoutes } from 'react-router'
import { describe, expect, it } from 'vitest'

import {
  experimentHref,
  experimentKindHref,
  experimentKinds,
  experiments,
} from '@/content/experiments'
import { projects } from '@/content/projects'
import { showcaseProjects } from '@/content/showcase-projects'
import { templateHref, templates } from '@/content/templates'
import { docNodes, docRedirects } from '@/docs/manifest'
import { noteHref, notes } from '@/notes/manifest'
import { registry, registryHref } from '@/registry'
import { createRoutes } from '@/router/routes'
import { readFile } from '@/test/repo-files'

// `vercel.json` is what makes a direct load or a refresh of a nested URL work on the host: the
// browser router has no page for `/docs/installation` on the server, so the host has to answer it
// with index.html. Vite's preview server does that by itself, which is why the end-to-end tests
// cannot tell. This test compiles the file with Vercel's own route compiler and checks the result
// against every URL the app serves. It models how Vercel reads the file, not Vercel itself; the
// steps in docs/deployment run the same checks against a real deployment.

interface VercelConfig extends Pick<GetRoutesProps, 'rewrites' | 'headers'> {
  framework?: string
  buildCommand?: string
  outputDirectory?: string
  env?: unknown
  build?: { env?: unknown }
}

const source = readFile('vercel.json')
const config = JSON.parse(source ?? '{}') as VercelConfig

const { routes, error } = getTransformedRoutes({
  rewrites: config.rewrites ?? [],
  headers: config.headers ?? [],
})

type RouteWithSrc = Extract<Route, { src: string }>
const compiled: readonly Route[] = routes ?? []
const withSrc = compiled.filter((route): route is RouteWithSrc => 'src' in route)

function matches(route: RouteWithSrc, path: string): boolean {
  return new RegExp(route.src).test(path)
}

/** The response headers Vercel would add to a path, merged in the order the file lists them. */
function headersFor(path: string): Record<string, string> {
  return Object.assign(
    {},
    ...withSrc.filter((route) => route.headers && matches(route, path)).map((r) => r.headers),
  ) as Record<string, string>
}

/** The page URLs the app serves, from the same typed data its routes and navigation read. */
const pagePaths: readonly string[] = [
  '/',
  '/components',
  '/blocks',
  '/templates',
  '/playground',
  '/labs',
  '/lab',
  '/notes',
  '/projects',
  '/about',
  ...docNodes.map((node) => node.href),
  ...Object.keys(docRedirects),
  ...registry.map((entry) => registryHref(entry)),
  ...templates.map((template) => templateHref(template)),
  ...Object.values(experimentKinds).map((kind) => experimentKindHref(kind.path)),
  ...experiments.map((experiment) => experimentHref(experiment)),
  ...notes.map((note) => noteHref(note)),
  ...[...projects, ...showcaseProjects].map((project) => `/projects/${project.slug}`),
]

/** Not pages, but URLs a visitor can type: the app answers them with its own 404 page. */
const unknownPaths = ['/docs/does-not-exist', '/components/not-a-component', '/nowhere/at/all']

/** Files and folders the host must serve itself, or answer with a 404, never with index.html. */
const filePaths = [
  '/assets/index-abc123.js',
  '/assets/missing-chunk.js',
  '/assets/maplibre-gl-worker-abc123.js',
  '/r/kbd.json',
  '/r/missing.json',
  '/favicon.svg',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

const spaRewrites = withSrc.filter((route) => route.dest === '/index.html')

describe('vercel.json', () => {
  it('compiles without errors', () => {
    expect(source, 'vercel.json is readable from a test').toBeDefined()
    expect(error).toBeNull()
  })

  it('has one fallback to index.html, applied only after the host looked for a file', () => {
    expect(spaRewrites).toHaveLength(1)
    // `handle` is marked deprecated for use in vercel.json; it is what the compiler emits, and is
    // the marker between the routes that run before the file lookup and the rewrites after it.
    const filesystem = compiled.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      (route) => 'handle' in route && route.handle === 'filesystem',
    )
    const fallback = compiled.findIndex((route) => 'dest' in route && route.dest === '/index.html')
    expect(filesystem).toBeGreaterThanOrEqual(0)
    expect(fallback).toBeGreaterThan(filesystem)
  })

  it('lists real pages of the site, not made-up ones', () => {
    const routeTree = createRoutes()
    expect(pagePaths.length).toBeGreaterThan(60)
    const unserved = pagePaths.filter((path) => {
      const last = matchRoutes(routeTree, path)?.at(-1)
      return last === undefined || last.route.path === '*'
    })
    expect(unserved).toEqual([])
  })

  it('sends every page, and every URL that is no file, to index.html', () => {
    const [fallback] = spaRewrites
    expect(fallback).toBeDefined()
    const unrouted = [...pagePaths, ...unknownPaths].filter(
      (path) => !(fallback && matches(fallback, path)),
    )
    expect(unrouted).toEqual([])
  })

  it('does not send a file, or a missing file, to index.html', () => {
    const [fallback] = spaRewrites
    const rewritten = filePaths.filter((path) => fallback && matches(fallback, path))
    // A missing script answered with index.html is a 200 with the wrong type: the browser reports
    // "Expected a JavaScript module", and MapLibre's worker fails to start.
    expect(rewritten).toEqual([])
  })

  it('caches the hashed assets for a year and leaves the HTML to revalidate', () => {
    expect(headersFor('/assets/index-abc123.js')['Cache-Control']).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(headersFor('/')['Cache-Control']).toBeUndefined()
    expect(headersFor('/docs/installation')['Cache-Control']).toBeUndefined()
    // The registry JSON changes in place at the same URL.
    expect(headersFor('/r/kbd.json')['Cache-Control']).toBeUndefined()
  })

  it('adds the security headers to every kind of response', () => {
    for (const path of ['/', '/docs/installation', '/assets/index-abc123.js', '/r/kbd.json']) {
      expect(headersFor(path), path).toMatchObject({
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
      })
    }
  })

  it('builds with the repository scripts into the folder Vite writes', () => {
    const scripts = (JSON.parse(readFile('package.json') ?? '{}') as { scripts?: object }).scripts
    expect(config.framework).toBe('vite')
    expect(config.outputDirectory).toBe('dist')
    expect(config.buildCommand).toBe('pnpm build && pnpm dist:check')
    expect(scripts).toHaveProperty('build')
    expect(scripts).toHaveProperty('dist:check')
  })

  it('carries no environment variables: settings and secrets belong to the host', () => {
    expect(config.env).toBeUndefined()
    expect(config.build?.env).toBeUndefined()
  })
})
