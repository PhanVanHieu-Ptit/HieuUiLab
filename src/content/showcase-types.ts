import type { RegistryKind } from '@/registry/types'

export type ShowcaseCategory = 'platform' | 'library' | 'experiment' | 'application'

/**
 * A file in this repository that backs a claim. The validator checks that `path` exists and that
 * `anchor`, when given, occurs in it, so a claim cannot outlive the code it describes.
 */
export interface EvidenceRef {
  label: string
  /** Repository-relative, e.g. "src/router/routes.tsx". */
  path: string
  /** Text that must occur in the file, e.g. the name of the test that proves the claim. */
  anchor?: string
}

export interface ShowcaseDecision {
  title: string
  rationale: string
  tradeoff: string
}

export interface ArchitecturePart {
  name: string
  responsibility: string
  /** The part's entry point: a repository-relative file, validated like evidence. */
  path: string
}

export interface ShowcaseChallenge {
  challenge: string
  solution: string
  /** At least one file that shows the solution works (code, test, or CI). */
  evidence: readonly [EvidenceRef, ...EvidenceRef[]]
}

/** What a project page shows instead of a claim: something running, or a place to go. */
export type ShowcaseMedia =
  | { kind: 'lab-demo'; slug: string; caption: string }
  | {
      kind: 'registry-example'
      entry: string
      entryKind: RegistryKind
      example: string
      caption: string
    }
  | { kind: 'template'; slug: string; caption: string }
  | { kind: 'route-link'; href: string; label: string; description: string }
  | {
      kind: 'screenshot'
      /** Absolute path under public/showcase/, e.g. "/showcase/my-app/home.png". */
      src: string
      alt: string
      caption: string
      width: number
      height: number
    }

export interface ShowcaseRepository {
  /** Must be a repository under the site owner's own GitHub account. */
  url: string
  /** ISO date the repository was last confirmed public. */
  verifiedOn: string
}

export interface LiveDeployment {
  status: 'live'
  url: string
  /** ISO date the URL was last confirmed to serve the project. */
  verifiedOn: string
}

export type ShowcaseDeployment = { status: 'none' } | LiveDeployment

interface PublicProjectBase {
  /**
   * The only visibility. Private professional work is never listed, so no entry can carry a
   * repository, demo, or media for it.
   */
  visibility: 'public'
  slug: string
  title: string
  summary: string
  role: string
  period: string
  stack: readonly string[]
  problem: readonly string[]
  scope: {
    summary: string
    includes: readonly string[]
    excludes: readonly string[]
  }
  decisions: readonly ShowcaseDecision[]
  architecture: {
    summary: string
    parts: readonly ArchitecturePart[]
  }
  challenges: readonly ShowcaseChallenge[]
  media: readonly [ShowcaseMedia, ...ShowcaseMedia[]]
  repository: ShowcaseRepository
  limitations: readonly string[]
  improvements: readonly string[]
  /** Slugs of case studies (see projects.ts) that go deeper on part of this project. */
  relatedCaseStudies?: readonly string[]
}

/**
 * A public project. An `application` needs both a public repository and a live deployment, so
 * it cannot be listed on the strength of a description alone.
 */
export type ShowcaseProject =
  | (PublicProjectBase & {
      category: 'platform' | 'library' | 'experiment'
      deployment: ShowcaseDeployment
    })
  | (PublicProjectBase & { category: 'application'; deployment: LiveDeployment })

export const showcaseCategoryLabels: Readonly<Record<ShowcaseCategory, string>> = {
  platform: 'Platform',
  library: 'Component library',
  experiment: 'Experiment',
  application: 'Application',
}

export const visibilityLabel: Readonly<Record<ShowcaseProject['visibility'], string>> = {
  public: 'Public project',
}

/** Where a file of a project is on GitHub, e.g. for an evidence link. */
export function repositoryFileUrl(repository: ShowcaseRepository, path: string): string {
  return `${repository.url}/blob/main/${path}`
}

/** "PhanVanHieu-Ptit/HieuUiLab" from a repository URL, for link text. */
export function repositoryName(repository: ShowcaseRepository): string {
  return new URL(repository.url).pathname.replace(/^\//, '')
}
