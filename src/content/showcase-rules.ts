import type { RegistryKind } from '@/registry/types'

import type { EvidenceRef, ShowcaseMedia, ShowcaseProject } from './showcase-types'

/**
 * Rules that keep the project showcase honest. They are pure: everything that needs the
 * repository, the registry, or the router comes in through {@link ShowcaseContext}, so a test can
 * feed in a bad project and watch the rule fire.
 */

export interface ShowcaseContext {
  /** The site owner's GitHub profile, e.g. "https://github.com/owner". Repositories must live under it. */
  ownerProfileUrl: string
  fileExists: (path: string) => boolean
  fileContains: (path: string, text: string) => boolean
  hasLabDemo: (slug: string) => boolean
  hasRegistryExample: (entry: string, kind: RegistryKind, example: string) => boolean
  hasTemplate: (slug: string) => boolean
  hasPublicAsset: (path: string) => boolean
  /** True when an in-app path resolves to a real page (not the not-found route). */
  routeExists: (href: string) => boolean
  caseStudySlugs: readonly string[]
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const IN_APP_PATH = /^\/[a-z0-9/-]*$/

const ALLOWED_PATH_ROOTS = ['src/', 'e2e/', '.github/workflows/', 'public/'] as const
const ALLOWED_ROOT_FILES = new Set([
  'README.md',
  'package.json',
  'index.html',
  'eslint.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
  'vite.config.ts',
  'playwright.config.ts',
])

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

function ownerOf(profileUrl: string): string | undefined {
  const url = parseUrl(profileUrl)
  if (url?.hostname !== 'github.com') return undefined
  return url.pathname.split('/').find((part) => part !== '')
}

/**
 * True only for `https://github.com/<owner>/<repo>` under the site owner's own account. A
 * repository in anyone else's account or organization, including an employer's, cannot pass.
 */
export function isOwnRepositoryUrl(value: string, ownerProfileUrl: string): boolean {
  const url = parseUrl(value)
  const owner = ownerOf(ownerProfileUrl)
  if (!url || !owner) return false
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') return false
  if (url.username || url.password || url.port || url.search || url.hash) return false
  const match = /^\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/.exec(url.pathname)
  if (!match) return false
  const [, urlOwner, repo] = match
  return urlOwner?.toLowerCase() === owner.toLowerCase() && repo !== '.' && repo !== '..'
}

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/

/** An https URL on a real public host, and not the repository page itself. */
export function isPublicDeploymentUrl(value: string): boolean {
  const url = parseUrl(value)
  if (!url) return false
  if (url.protocol !== 'https:' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false
  if (IPV4.test(host) || host.startsWith('[')) return false
  if (!host.includes('.')) return false
  // A repository page is not a deployment.
  return host !== 'github.com'
}

/**
 * A repository-relative path that may be cited as evidence: no traversal, no secrets, and only
 * under the source, test, CI, and public folders or a few well-known root files.
 */
export function isSafeRepoPath(value: string): boolean {
  if (value === '' || value.startsWith('/') || value.includes('\\') || value.includes('//')) {
    return false
  }
  const parts = value.split('/')
  if (parts.some((part) => part === '' || part === '.' || part === '..')) return false
  if (parts.some((part) => part === 'node_modules' || part.startsWith('.env'))) return false
  if (ALLOWED_ROOT_FILES.has(value)) return true
  return ALLOWED_PATH_ROOTS.some((root) => value.startsWith(root))
}

// A tripwire for the kinds of claim this site must not make on a personal project. It does not
// prove a claim true; the evidence requirement does that. It only catches the obvious slips.
const METRIC =
  /\d+(?:\.\d+)?\s*(?:%|×|x|ms|kb|mb|stars?|downloads?|users?|customers?|fps)(?![a-z])/i
const BUSINESS_CLAIM =
  /\b(?:customers?|clients?|employers?|revenue|enterprise|companies|company)(?![-\w])|\bin production\b|\bproduction (?:use|usage|traffic)\b|\bmonthly active\b/i
const LINK_OR_EMAIL = /https?:\/\/|www\.|[\w.+-]+@[\w-]+\.[\w.]+/i

export function findUnsupportedClaim(text: string): string | undefined {
  if (METRIC.test(text)) return 'a numeric metric'
  if (BUSINESS_CLAIM.test(text)) return 'a customer, employer, or production claim'
  if (LINK_OR_EMAIL.test(text)) return 'a link or email in prose'
  return undefined
}

function proseOf(project: ShowcaseProject): string[] {
  const media = project.media.flatMap((item): string[] => {
    switch (item.kind) {
      case 'route-link':
        return [item.label, item.description]
      case 'screenshot':
        return [item.alt, item.caption]
      default:
        return [item.caption]
    }
  })
  return [
    project.title,
    project.summary,
    project.role,
    ...project.problem,
    project.scope.summary,
    ...project.scope.includes,
    ...project.scope.excludes,
    ...project.decisions.flatMap((d) => [d.title, d.rationale, d.tradeoff]),
    project.architecture.summary,
    ...project.architecture.parts.flatMap((p) => [p.name, p.responsibility]),
    ...project.challenges.flatMap((c) => [
      c.challenge,
      c.solution,
      ...c.evidence.map((e) => e.label),
    ]),
    ...media,
    ...project.limitations,
    ...project.improvements,
  ]
}

/** What an evidence check needs from the repository; the profile rules share it. */
export type EvidenceContext = Pick<ShowcaseContext, 'fileExists' | 'fileContains'>

function checkPath(
  path: string,
  where: string,
  ctx: EvidenceContext,
  problems: string[],
  anchor?: string,
) {
  if (!isSafeRepoPath(path)) {
    problems.push(`${where}: "${path}" is not a safe repository-relative path`)
  } else if (!ctx.fileExists(path)) {
    problems.push(`${where}: "${path}" does not exist`)
  } else if (anchor !== undefined && !ctx.fileContains(path, anchor)) {
    problems.push(`${where}: "${path}" does not contain "${anchor}"`)
  }
}

export function checkEvidence(
  ref: EvidenceRef,
  where: string,
  ctx: EvidenceContext,
  problems: string[],
) {
  if (ref.label.trim() === '') problems.push(`${where}: evidence has no label`)
  checkPath(ref.path, where, ctx, problems, ref.anchor)
}

function checkMedia(item: ShowcaseMedia, where: string, ctx: ShowcaseContext, problems: string[]) {
  switch (item.kind) {
    case 'lab-demo':
      if (!ctx.hasLabDemo(item.slug)) problems.push(`${where}: no lab demo "${item.slug}"`)
      break
    case 'registry-example':
      if (!ctx.hasRegistryExample(item.entry, item.entryKind, item.example)) {
        problems.push(`${where}: no ${item.entryKind} example "${item.entry}/${item.example}"`)
      }
      break
    case 'template':
      if (!ctx.hasTemplate(item.slug)) problems.push(`${where}: no template "${item.slug}"`)
      break
    case 'route-link':
      if (!IN_APP_PATH.test(item.href) || !ctx.routeExists(item.href)) {
        problems.push(`${where}: "${item.href}" is not a page of this site`)
      }
      break
    case 'screenshot':
      if (!item.src.startsWith('/showcase/') || !ctx.hasPublicAsset(item.src)) {
        problems.push(`${where}: no screenshot file at "${item.src}" under public/showcase/`)
      }
      if (item.alt.trim() === '') problems.push(`${where}: screenshot has no alt text`)
      if (item.caption.trim() === '') problems.push(`${where}: screenshot has no caption`)
      if (!Number.isInteger(item.width) || item.width <= 0) {
        problems.push(`${where}: screenshot width must be a positive integer`)
      }
      if (!Number.isInteger(item.height) || item.height <= 0) {
        problems.push(`${where}: screenshot height must be a positive integer`)
      }
      break
  }
}

/**
 * Every problem found in `projects`, as readable lines; an empty array means the showcase is
 * valid. Checks structure, uniqueness, links, evidence, and unsupported claims.
 */
export function validateShowcase(
  projects: readonly ShowcaseProject[],
  ctx: ShowcaseContext,
): string[] {
  const problems: string[] = []
  const seen = new Set<string>()

  for (const project of projects) {
    const at = project.slug
    const fail = (message: string) => problems.push(`${at}: ${message}`)

    if (!SLUG.test(project.slug)) fail('slug must be lowercase words joined by hyphens')
    if (seen.has(project.slug)) fail('slug is used twice')
    seen.add(project.slug)
    if (ctx.caseStudySlugs.includes(project.slug)) fail('slug collides with a case study')

    // Runtime guard for data that bypasses the type (e.g. a cast or JSON).
    if ((project.visibility as string) !== 'public') fail('only public projects may be listed')

    if (!isOwnRepositoryUrl(project.repository.url, ctx.ownerProfileUrl)) {
      fail(`repository must be a repository under ${ctx.ownerProfileUrl}`)
    }
    if (!isIsoDate(project.repository.verifiedOn)) fail('repository.verifiedOn must be an ISO date')

    if (project.deployment.status === 'live') {
      if (!isPublicDeploymentUrl(project.deployment.url)) {
        fail('deployment.url must be a public https URL (not localhost, an IP, or the repository)')
      }
      if (!isIsoDate(project.deployment.verifiedOn))
        fail('deployment.verifiedOn must be an ISO date')
    } else if ((project.category as string) === 'application') {
      fail('an application needs a live deployment as well as a public repository')
    }

    if (project.problem.length === 0) fail('needs a problem statement')
    if (project.decisions.length === 0) fail('needs at least one technical decision')
    if (project.architecture.parts.length === 0) fail('needs architecture parts')
    if (project.challenges.length === 0) fail('needs at least one challenge with evidence')
    if (project.limitations.length === 0) fail('needs known limitations')
    if (project.improvements.length === 0) fail('needs future improvements')

    project.architecture.parts.forEach((part, index) => {
      checkPath(
        part.path,
        `${at}: architecture part ${String(index + 1)} (${part.name})`,
        ctx,
        problems,
      )
    })
    project.challenges.forEach((challenge, index) => {
      const where = `${at}: challenge ${String(index + 1)}`
      if (challenge.evidence.length === 0) problems.push(`${where}: needs evidence`)
      for (const ref of challenge.evidence) checkEvidence(ref, where, ctx, problems)
    })
    project.media.forEach((item, index) => {
      checkMedia(item, `${at}: media ${String(index + 1)} (${item.kind})`, ctx, problems)
    })

    for (const slug of project.relatedCaseStudies ?? []) {
      if (!ctx.caseStudySlugs.includes(slug)) fail(`related case study "${slug}" does not exist`)
    }

    for (const text of proseOf(project)) {
      const claim = findUnsupportedClaim(text)
      if (claim) fail(`contains ${claim}: "${text}"`)
    }
  }

  return problems
}
