import { experimentKinds, experimentKindHref } from '@/content/experiments'
import { templateBlocks, templateHref, templates } from '@/content/templates'
import { DOCS_BASE, docGroups, docHref, type DocEntry } from '@/docs/manifest'
import { getRegistryEntries, getRegistryEntry, registryHref } from '@/registry'
import { registryCategories } from '@/registry/taxonomy'
import type { RegistryKind, RegistryStatus } from '@/registry/types'

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
  /**
   * Hide from the header below this breakpoint, where it would crowd the bar. Still in the drawer
   * and footer.
   */
  headerFrom?: 'lg' | 'xl'
  /** Extra terms the search palette matches, e.g. a registry entry's category and tags. */
  keywords?: readonly string[]
  /** Pages nested under this one, listed beneath it in the sidebar. */
  children?: readonly NavItem[]
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
  templates: {
    title: 'Templates',
    description:
      'Example apps built by combining the lab’s blocks: each one runs in the page, with invented data, and shows the source it is made from.',
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
    heading: 'Projects and case studies',
    description:
      'Public projects with their source, what each one set out to solve, the decisions behind it, and its known limits, followed by deeper case studies of parts of this lab.',
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
  {
    title: 'Templates',
    href: '/templates',
    description: 'Example apps built from the blocks.',
    headerFrom: 'lg',
  },
  { title: 'Labs', href: '/labs', description: 'Geospatial and 3D experiments.' },
  { title: 'Projects', href: '/projects', description: 'Projects and case studies.' },
  { title: 'Notes', href: '/notes', description: 'Short technical write-ups.' },
  { title: 'Docs', href: '/docs' },
  { title: 'About', href: '/about', description: 'What the lab is.', headerFrom: 'xl' },
]

function registryNavItems(kind: RegistryKind): NavItem[] {
  return getRegistryEntries(kind).map((entry) => ({
    title: entry.name,
    href: registryHref(entry),
    description: entry.description,
    status: entry.status,
    keywords: [registryCategories[entry.category].label, ...entry.tags],
  }))
}

function templateNavItems(): NavItem[] {
  return templates.map((template) => ({
    title: template.title,
    href: templateHref(template),
    description: template.summary,
    status: template.status,
    keywords: [
      'template',
      'example app',
      ...template.tags,
      ...templateBlocks(template).map((slug) => getRegistryEntry(slug, 'block')?.name ?? slug),
    ],
  }))
}

function docNavItem(entry: DocEntry, parentHref: string): NavItem {
  const href = docHref(parentHref, entry.slug)
  return {
    title: entry.title,
    href,
    description: entry.description,
    ...(entry.keywords ? { keywords: entry.keywords } : {}),
    ...(entry.children ? { children: entry.children.map((child) => docNavItem(child, href)) } : {}),
  }
}

/** Documentation sidebar. The written docs come from the docs manifest; components and blocks are derived from the registry. */
export const docsNav: readonly NavSection[] = [
  ...docGroups.map((group) => ({
    title: group.title,
    items: group.pages.map((page) => docNavItem(page, DOCS_BASE)),
  })),
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
    title: 'Templates',
    href: '/templates',
    items: [
      {
        title: 'All templates',
        href: '/templates',
        description: sections.templates.description,
        keywords: ['example apps', 'gallery'],
      },
      ...templateNavItems(),
    ],
  },
  {
    title: 'Tools',
    items: [
      {
        title: 'Playground',
        href: '/playground',
        description:
          'Try Button, Input, Badge, Dialog, and Data table with typed controls, a light or dark preview, and a chosen width. Pre-defined examples only; it is not a code editor.',
        keywords: ['controls', 'props', 'sandbox', 'preview', 'theme', 'viewport'],
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

/** The items and everything nested beneath them, parents before their children. */
export function flattenNavItems(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flattenNavItems(item.children ?? [])])
}

/** The docs nav item for a path, e.g. to derive a docs page's title and description. */
export function findDocsNavItem(href: string): NavItem | undefined {
  return flattenNavItems(docsNav.flatMap((section) => section.items)).find(
    (item) => item.href === href,
  )
}
