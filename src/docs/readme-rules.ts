import { DOCS_BASE } from './manifest'
import { linkShape, REPO_PATH, ROOT_FILES } from './markdown-rules'
import { parseMarkdown, walkInlines } from './markdown'

// README.md is not a docs page, so `validateDocs` does not read it, yet it names repository files
// and site routes in code. This checks those references against the repository the same way the
// docs are checked, as a pure function over an injected context (see `validateDocs`). It checks
// references only; the README's prose is not held to the docs style rules.

export interface ReadmeContext {
  /** True for a file or a directory. */
  pathExists(path: string): boolean
  /** True when the site serves the path and the router resolves it to a page. */
  routeExists(path: string): boolean
  /** The URLs of the docs pages. */
  docsHrefs: ReadonlySet<string>
  /** Old docs URLs and where they go. */
  redirects: Readonly<Record<string, string>>
}

export interface ReadmeReport {
  problems: string[]
  /** How many repository paths and routes were checked, so a test can tell it checked something. */
  pathsChecked: number
  routesChecked: number
}

/** A concrete route written in code. `/blocks/:slug`, `/docs/<page>`, and `?query` are patterns. */
const ROUTE = /^\/(?:[\w-]+(?:\/[\w-]+)*)?$/

function routeProblem(route: string, ctx: ReadmeContext): string | undefined {
  // A legacy URL the README mentions on purpose is fine for as long as it still redirects.
  if (Object.hasOwn(ctx.redirects, route)) return undefined
  if (route === DOCS_BASE || route.startsWith(`${DOCS_BASE}/`)) {
    return ctx.docsHrefs.has(route) ? undefined : `${route} is not a docs page`
  }
  return ctx.routeExists(route) ? undefined : `${route} is not a page on this site`
}

export function validateReadme(source: string, ctx: ReadmeContext): ReadmeReport {
  const report: ReadmeReport = { problems: [], pathsChecked: 0, routesChecked: 0 }

  walkInlines(parseMarkdown(source).blocks, (inline) => {
    if (inline.type === 'link') {
      const shape = linkShape(inline.href)
      if (shape.kind === 'invalid') report.problems.push(shape.message)
      else if (shape.kind === 'path') {
        report.routesChecked += 1
        const problem = routeProblem(shape.path, ctx)
        if (problem) report.problems.push(`link ${inline.href}: ${problem}`)
      }
      return
    }
    if (inline.type !== 'code') return

    const { text } = inline
    if (REPO_PATH.test(text) && (text.includes('/') || ROOT_FILES.has(text))) {
      report.pathsChecked += 1
      if (!ctx.pathExists(text.replace(/\/$/, ''))) {
        report.problems.push(`${text} does not exist in the repository`)
      }
    } else if (ROUTE.test(text)) {
      report.routesChecked += 1
      const problem = routeProblem(text, ctx)
      if (problem) report.problems.push(problem)
    }
  })

  return report
}
