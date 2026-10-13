import type { RegistryStatus } from '@/registry/types'

/** A link from content; `href` starting with "/" is an in-app route, anything else is external. */
export interface ContentLink {
  label: string
  href: string
}

export interface ContentSection {
  heading: string
  paragraphs: readonly string[]
  code?: { language: 'tsx' | 'bash' | 'text'; title?: string; code: string }
}

export interface Note {
  slug: string
  title: string
  summary: string
  /** ISO date (YYYY-MM-DD) the note was written. */
  date: string
  tags: readonly string[]
  body: readonly ContentSection[]
}

/** An engineering case study. Content describes work that exists in this repository. */
export interface Project {
  slug: string
  title: string
  summary: string
  role: string
  period: string
  stack: readonly string[]
  links: readonly ContentLink[]
  /** Qualitative and verifiable from the source; never an invented number. */
  outcome: string
  body: readonly ContentSection[]
}

export type ExperimentKind = 'geospatial' | '3d'

export interface Experiment {
  slug: string
  title: string
  summary: string
  kind: ExperimentKind
  status: RegistryStatus
  /** What the experiment demonstrates, one line each. */
  capabilities: readonly string[]
  body: readonly ContentSection[]
}

export interface TechItem {
  name: string
  purpose: string
  href: string
}

export interface TechGroup {
  title: string
  items: readonly TechItem[]
}

export interface Capability {
  title: string
  description: string
  href: string
  linkLabel: string
}
