import { matchRoutes } from 'react-router'
import { beforeAll, describe, expect, it } from 'vitest'

import { createRoutes } from '@/router/routes'
import { createDocsContext } from '@/test/docs-context'
import { readFile } from '@/test/repo-files'

import { validateReadme, type ReadmeContext } from './readme-rules'

// README.md names repository files and site routes in code. They are checked against the
// repository, so a renamed file or a moved page is named here rather than found by a reader. Run
// it alone with `pnpm docs:check`.

let real: ReadmeContext

/**
 * A page the router serves with no URL parameter to fill in, like `/` or the legacy `/lab`. The
 * docs checker also wants a path to be in the site's nav or typed data, which these are not. A
 * path that only fits a parameter (`/labs/3d/typo`) still has to be in that data.
 */
const routes = createRoutes()
function servesStaticPage(path: string): boolean {
  const last = matchRoutes(routes, path)?.at(-1)
  return last !== undefined && last.route.path !== '*' && Object.keys(last.params).length === 0
}

beforeAll(async () => {
  const docs = await createDocsContext()
  real = {
    pathExists: (path) => docs.pathExists(path),
    routeExists: (path) => docs.routeExists(path) || servesStaticPage(path),
    docsHrefs: new Set(docs.pages.map(({ node }) => node.href)),
    redirects: docs.redirects,
  }
})

describe('README.md', () => {
  it('names only files and pages that exist', () => {
    const source = readFile('README.md')
    expect(source, 'README.md is readable from a test').toBeDefined()

    const report = validateReadme(source ?? '', real)
    expect(report.problems).toEqual([])
    // It looked at something: the README lists dozens of paths and a table of routes.
    expect(report.pathsChecked).toBeGreaterThan(20)
    expect(report.routesChecked).toBeGreaterThan(10)
  })
})

describe('README.md scripts table', () => {
  it('lists every script in package.json, and only scripts that exist', () => {
    const readme = readFile('README.md') ?? ''
    const manifest = JSON.parse(readFile('package.json') ?? '{}') as {
      scripts?: Record<string, string>
    }
    const scripts = Object.keys(manifest.scripts ?? {})
    const documented = [...readme.matchAll(/^\| `pnpm ([\w:-]+)(?: [^`]*)?`\s+\|/gm)].map(
      (match) => match[1] ?? '',
    )

    expect(scripts.length).toBeGreaterThan(20)
    // perf:measure was added in a pull request and left out of the table without any test noticing.
    expect(scripts.filter((script) => !documented.includes(script))).toEqual([])
    expect(documented.filter((script) => !scripts.includes(script))).toEqual([])
  })
})

describe('validateReadme', () => {
  const ctx: ReadmeContext = {
    pathExists: (path) => ['src/docs', 'src/docs/manifest.ts', 'package.json'].includes(path),
    routeExists: (path) => ['/', '/components', '/about'].includes(path),
    docsHrefs: new Set(['/docs', '/docs/testing']),
    redirects: { '/docs/old-name': '/docs/testing' },
  }
  const check = (source: string) => validateReadme(source, ctx)

  it('accepts files, directories, root files, docs pages, routes and a legacy URL', () => {
    const report = check(
      'See `src/docs/manifest.ts`, `src/docs/`, `package.json`, `/docs`, `/docs/testing`, `/components`, `/` and `/docs/old-name`.',
    )
    expect(report.problems).toEqual([])
    expect(report.pathsChecked).toBe(3)
    expect(report.routesChecked).toBe(5)
  })

  it('names a file that does not exist', () => {
    expect(check('Edit `src/docs/missing.ts` first.').problems).toEqual([
      'src/docs/missing.ts does not exist in the repository',
    ])
  })

  it('names a docs page and a route that do not exist', () => {
    expect(check('Open `/docs/gone` or `/nowhere`.').problems).toEqual([
      '/docs/gone is not a docs page',
      '/nowhere is not a page on this site',
    ])
  })

  it('checks the target of a link, and refuses a link that is not https or a site path', () => {
    expect(check('[a](/docs/gone) [b](http://example.com) [c](relative.md)').problems).toEqual([
      'link /docs/gone: /docs/gone is not a docs page',
      'link http://example.com is not https',
      'link "relative.md" must be an https:// URL, a /path on this site, or a #heading',
    ])
  })

  it('leaves patterns, queries and code that is not a path or a route alone', () => {
    const report = check(
      'Use `/blocks/:slug`, `/docs/<page>`, `/playground?example=<id>`, `pnpm test`, `a/b` and `{ "x": 1 }`.',
    )
    expect(report).toEqual({ problems: [], pathsChecked: 0, routesChecked: 0 })
  })

  it('finds references inside tables and lists', () => {
    const report = check(
      '| Path | Page |\n| --- | --- |\n| `/about` | About |\n\n- `src/missing/` here',
    )
    expect(report.problems).toEqual(['src/missing/ does not exist in the repository'])
    expect(report.routesChecked).toBe(1)
  })
})
