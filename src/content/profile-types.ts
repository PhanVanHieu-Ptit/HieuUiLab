import type { EvidenceRef } from './showcase-types'

/**
 * The shape of the About page's profile. There is deliberately no field for an employer, a job
 * title, a school, a certification, a year count, or a metric: the profile can only say what a
 * repository file backs, so those claims have nowhere to live. `validateProfile` checks the rest.
 */

export interface ProfileTool {
  name: string
  /** The npm package. When set it must be in package.json; leave it out for SVG, WebGL2, and the like. */
  package?: string
}

/** One area of frontend engineering, with the files, projects, and notes that show it. */
export interface SkillDomain {
  id: string
  title: string
  /** What the repository demonstrates, in qualitative terms. */
  summary: string
  tools: readonly ProfileTool[]
  /** Files that back the summary. The validator checks each path and anchor. */
  evidence: readonly [EvidenceRef, ...EvidenceRef[]]
  /** Slugs of public projects or case studies (`/projects/<slug>`). */
  projects: readonly string[]
  /** Slugs of engineering notes (`/notes/<slug>`). */
  notes: readonly string[]
  /** What the repository does not show about this domain. Only a limit a repository file states. */
  boundary?: string
}

/** Something still to learn. It is never presented as experience. */
export interface LearningGoal {
  id: string
  title: string
  why: string
  /** What the repository has today, so the goal cannot read as an achievement. */
  today: string
  evidence: EvidenceRef
  /** A package that must not be in package.json yet. Installing it forces this goal to be rewritten. */
  notYetDependency?: string
}

export type ProfileLink =
  | { kind: 'github' | 'repository' | 'issues'; url: string }
  /** A file under public/, e.g. "/cv.pdf". */
  | { kind: 'cv'; path: string }
  | { kind: 'email'; address: string }

export interface Profile {
  headline: string
  intro: readonly string[]
  domains: readonly SkillDomain[]
  goals: readonly LearningGoal[]
  links: readonly ProfileLink[]
}

/** How a link is opened: another site in a new tab, a file served by this site, or a mail client. */
export type ProfileLinkTarget = 'web' | 'file' | 'mail'

export interface ResolvedProfileLink {
  kind: ProfileLink['kind']
  label: string
  href: string
  target: ProfileLinkTarget
}
