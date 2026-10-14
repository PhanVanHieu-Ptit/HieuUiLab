import { experimentKinds, experimentKindHref } from '@/content/experiments'
import { getRegistryEntries, registryHref } from '@/registry'
import type { RegistryStatus } from '@/registry/types'

export interface NavItem {
  title: string
  href: string
  description?: string
  status?: RegistryStatus
  /** Shown but not navigable, e.g. a section that is not built yet. */
  disabled?: boolean
  /** Short label rendered next to the title, e.g. "Soon". */
  label?: string
  /** Also mark the item active on nested routes, e.g. a section on its detail pages. */
  matchNested?: boolean
  /** Hide from the header below `lg`, where it would crowd the bar. Still in the drawer and footer. */
  headerFromLg?: boolean
}

export interface NavSection {
  title: string
  /** Landing page for the section. */
  href?: string
  items: readonly NavItem[]
}

export interface Crumb {
  title: string
  href?: string
}

export const siteConfig = {
  name: 'Hieu UI Lab',
  description:
    'Reusable React components, UI blocks, and frontend engineering experiments, documented and tested.',
  githubUrl: 'https://github.com/PhanVanHieu-Ptit/HieuUiLab',
  githubProfileUrl: 'https://github.com/PhanVanHieu-Ptit',
  issuesUrl: 'https://github.com/PhanVanHieu-Ptit/HieuUiLab/issues/new',
} as const

/**
 * Title and description of each section, shared by its page header and its
 * route metadata (document title, meta description, breadcrumb).
 */
export const sections = {
  components: {
    title: 'Components',
    description: 'Accessible building blocks. Copy the source into your project and own it.',
  },
  blocks: {
    title: 'Blocks',
    description:
      'Components composed into patterns, with loading, empty, error, and success states handled.',
  },
  labs: {
    title: 'Labs',
    heading: 'Geospatial and 3D experiments',
    description:
      'Small, working experiments with maps and graphics, written from first principles. Each one runs in the page, respects reduced motion, and explains how it works.',
  },
  notes: {
    title: 'Notes',
    heading: 'Technical notes',
    description:
      'Short write-ups of decisions made while building the lab: the problem, the approach, and its limits.',
  },
  projects: {
    title: 'Projects',
    heading: 'Engineering case studies',
    description:
      'How parts of this lab were designed, built, and verified — the context, the approach, and the trade-offs that remain.',
  },
  docs: {
    title: 'Docs',
    description: 'How the lab is organised, how to use its components, and how it is built.',
  },
  about: {
    title: 'About',
    heading: 'About the lab',
    description:
      'What Hieu UI Lab is, what it is built with, and what is finished or still planned.',
  },
} as const

/** Top-level destinations in the header, mobile drawer, and footer. */
export const mainNav: readonly NavItem[] = [
  { title: 'Components', href: '/components' },
  { title: 'Blocks', href: '/blocks' },
  { title: 'Labs', href: '/labs', description: 'Geospatial and 3D experiments.' },
  { title: 'Projects', href: '/projects', description: 'Engineering case studies.' },
  { title: 'Notes', href: '/notes', description: 'Short technical write-ups.' },
  { title: 'Docs', href: '/docs' },
  { title: 'About', href: '/about', description: 'What the lab is.', headerFromLg: true },
]

function registryNavItems(category: 'component' | 'block'): NavItem[] {
  return getRegistryEntries(category).map((entry) => ({
    title: entry.name,
    href: registryHref(entry),
    description: entry.description,
    status: entry.status,
  }))
}

/** Documentation sidebar. Components and blocks are derived from the registry. */
export const docsNav: readonly NavSection[] = [
  {
    title: 'Getting started',
    items: [
      {
        title: 'Introduction',
        href: '/docs',
        description: 'What the lab is and how the registry works.',
      },
      {
        title: 'Installation',
        href: '/docs/installation',
        description: 'Copy a component into your project, with its dependencies and tokens.',
      },
      {
        title: 'Architecture',
        href: '/docs/architecture',
        description: 'Project structure, the registry, routing, and code splitting.',
      },
      {
        title: 'Theming',
        href: '/docs/theming',
        description: 'Design tokens, themes, and shared interaction states.',
      },
    ],
  },
  {
    title: 'Components',
    href: '/components',
    items: registryNavItems('component'),
  },
  {
    title: 'Blocks',
    href: '/blocks',
    items: registryNavItems('block'),
  },
  {
    title: 'Planned',
    items: [
      {
        title: 'Templates',
        href: '/templates',
        description: 'Full pages composed from the registry’s blocks and components.',
        status: 'planned',
      },
      {
        title: 'Playground',
        href: '/playground',
        description: 'Try a component’s props live and copy the resulting code.',
        status: 'planned',
      },
    ],
  },
]

/** Lab categories, shown as their own group in the mobile drawer. */
export const labsNav: NavSection = {
  title: sections.labs.title,
  href: '/labs',
  items: [
    { title: 'All experiments', href: '/labs' },
    ...Object.values(experimentKinds).map((kind) => ({
      title: kind.title,
      href: experimentKindHref(kind.path),
      description: kind.description,
      matchNested: true,
    })),
  ],
}

/** The docs nav item for a path, e.g. to derive a docs page's title and description. */
export function findDocsNavItem(href: string): NavItem | undefined {
  return docsNav.flatMap((section) => section.items).find((item) => item.href === href)
}
