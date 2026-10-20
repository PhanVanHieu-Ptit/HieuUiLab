import type { Profile, ProfileLink } from './profile-types'
import {
  checkEvidence,
  findUnsupportedClaim,
  isOwnRepositoryUrl,
  type EvidenceContext,
} from './showcase-rules'

/**
 * Rules that keep the About page honest, in the same spirit as the showcase rules: everything that
 * needs the repository, the package list, or the content modules comes in through
 * {@link ProfileContext}, so a test can feed in a bad profile and watch the rule fire.
 */

export interface ProfileContext extends EvidenceContext {
  /** The site owner's GitHub profile, e.g. "https://github.com/owner". */
  ownerProfileUrl: string
  /** True when the name is in package.json `dependencies` or `devDependencies`. */
  hasPackage: (name: string) => boolean
  /** True when `/projects/<slug>` is a public project or case study. */
  hasProject: (slug: string) => boolean
  /** True when `/notes/<slug>` is an engineering note. */
  hasNote: (slug: string) => boolean
  /** True for a file under `public/`, given its URL path, e.g. "/cv.pdf". */
  hasPublicAsset: (path: string) => boolean
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CV_PATH = /^\/[A-Za-z0-9][A-Za-z0-9._/-]*\.pdf$/
const EMAIL = /^[^\s@?&/]+@[^\s@?&/]+\.[^\s@?&/]+$/

// Tripwires, not proof. The evidence requirement and the shape of the type are the real controls;
// these catch the wording that this page promises never to use.
const OVERSTATEMENT =
  /\b(?:expert(?:s|ise)?|industry[- ]leading|production[- ](?:proven|ready)|world[- ]class|best[- ]in[- ]class|battle[- ]tested|cutting[- ]edge|state[- ]of[- ]the[- ]art|award[- ]winning|guru|ninja|rockstar|senior|years? of (?:experience|professional)|\d+\+? years)\b/i
const EMPLOYMENT_OR_QUALIFICATION =
  /\b(?:worked (?:at|for|as)|employed|my (?:employer|job)|graduat\w*|bachelor|degree|diploma|university|college|certified|certificat\w*)\b/i

/** The first wording in `text` that the profile must not use, or undefined. */
export function findProfileOverclaim(text: string): string | undefined {
  const unsupported = findUnsupportedClaim(text)
  if (unsupported) return unsupported
  if (OVERSTATEMENT.test(text)) return 'an exaggerated claim'
  if (EMPLOYMENT_OR_QUALIFICATION.test(text)) return 'employment or qualification wording'
  return undefined
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

/** The path segments of an https GitHub URL under the owner's account, or undefined for any other URL. */
function ownerPathSegments(value: string, ownerProfileUrl: string): string[] | undefined {
  const url = parseUrl(value)
  const owner = parseUrl(ownerProfileUrl)
    ?.pathname.split('/')
    .find((part) => part !== '')
  if (!url || !owner) return undefined
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') return undefined
  if (url.username || url.password || url.port || url.search || url.hash) return undefined
  const segments = url.pathname.split('/').filter((part) => part !== '')
  return segments[0]?.toLowerCase() === owner.toLowerCase() ? segments : undefined
}

function checkLink(link: ProfileLink, ctx: ProfileContext): string | undefined {
  switch (link.kind) {
    case 'github': {
      const segments = ownerPathSegments(link.url, ctx.ownerProfileUrl)
      return segments?.length === 1
        ? undefined
        : `github must be the profile ${ctx.ownerProfileUrl}, not "${link.url}"`
    }
    case 'repository':
      return isOwnRepositoryUrl(link.url, ctx.ownerProfileUrl)
        ? undefined
        : `repository must be https://github.com/<owner>/<repo> under ${ctx.ownerProfileUrl}`
    case 'issues': {
      const segments = ownerPathSegments(link.url, ctx.ownerProfileUrl)
      return segments && segments.length >= 3 && segments[2] === 'issues'
        ? undefined
        : `issues must be a GitHub issues page under ${ctx.ownerProfileUrl}`
    }
    case 'cv':
      if (!CV_PATH.test(link.path)) return `cv "${link.path}" must be a .pdf path such as "/cv.pdf"`
      return ctx.hasPublicAsset(link.path)
        ? undefined
        : `cv "${link.path}" is not a file under public/`
    case 'email':
      return EMAIL.test(link.address) ? undefined : `email "${link.address}" is not a valid address`
  }
}

/**
 * Every problem found in `profile`, as readable lines; an empty array means the profile is valid.
 * Checks structure, evidence, references to projects and notes, tools, learning goals, links, and
 * wording that claims more than the repository shows.
 */
export function validateProfile(profile: Profile, ctx: ProfileContext): string[] {
  const problems: string[] = []
  const prose: string[] = [profile.headline, ...profile.intro]

  if (profile.headline.trim() === '') problems.push('profile: needs a headline')
  if (profile.intro.length === 0) problems.push('profile: needs an introduction')
  if (profile.domains.length === 0) problems.push('profile: needs skill domains')

  const domainIds = new Set<string>()
  for (const domain of profile.domains) {
    const at = `domain ${domain.id}`
    const fail = (message: string) => problems.push(`${at}: ${message}`)

    if (!ID.test(domain.id)) fail('id must be lowercase words joined by hyphens')
    if (domainIds.has(domain.id)) fail('id is used twice')
    domainIds.add(domain.id)
    if (domain.title.trim() === '' || domain.summary.trim() === '') {
      fail('needs a title and a summary')
    }
    if (domain.projects.length + domain.notes.length === 0) {
      fail('needs at least one project or note that shows it')
    }
    for (const slug of domain.projects) {
      if (!ctx.hasProject(slug)) fail(`no project or case study "${slug}"`)
    }
    for (const slug of domain.notes) {
      if (!ctx.hasNote(slug)) fail(`no note "${slug}"`)
    }
    for (const tool of domain.tools) {
      if (tool.name.trim() === '') fail('a tool has no name')
      if (tool.package !== undefined && !ctx.hasPackage(tool.package)) {
        fail(`tool "${tool.name}": "${tool.package}" is not in package.json`)
      }
    }
    for (const ref of domain.evidence) checkEvidence(ref, at, ctx, problems)
    if (domain.boundary?.trim() === '') {
      fail('boundary is empty; remove it or say what is not shown')
    }

    prose.push(
      domain.title,
      domain.summary,
      ...domain.tools.map((tool) => tool.name),
      ...domain.evidence.map((ref) => ref.label),
      ...(domain.boundary === undefined ? [] : [domain.boundary]),
    )
  }

  const goalIds = new Set<string>()
  for (const goal of profile.goals) {
    const at = `goal ${goal.id}`
    const fail = (message: string) => problems.push(`${at}: ${message}`)

    if (!ID.test(goal.id)) fail('id must be lowercase words joined by hyphens')
    if (goalIds.has(goal.id)) fail('id is used twice')
    goalIds.add(goal.id)
    if (goal.title.trim() === '' || goal.why.trim() === '' || goal.today.trim() === '') {
      fail('needs a title, a reason, and what the repository has today')
    }
    checkEvidence(goal.evidence, at, ctx, problems)
    if (goal.notYetDependency !== undefined && ctx.hasPackage(goal.notYetDependency)) {
      fail(
        `"${goal.notYetDependency}" is now in package.json; rewrite this goal as work that was done, or remove it`,
      )
    }

    prose.push(goal.title, goal.why, goal.today, goal.evidence.label)
  }

  const kinds = new Set<string>()
  for (const link of profile.links) {
    if (kinds.has(link.kind)) problems.push(`link ${link.kind}: listed twice`)
    kinds.add(link.kind)
    const problem = checkLink(link, ctx)
    if (problem) problems.push(`link ${link.kind}: ${problem}`)
  }

  for (const text of prose) {
    const claim = findProfileOverclaim(text)
    if (claim) problems.push(`profile: contains ${claim}: "${text}"`)
  }

  return problems
}
