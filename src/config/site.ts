import { registry } from '@/registry'
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
}

export interface NavSection {
  title: string
  /** Landing page for the section, used by breadcrumbs. */
  href?: string
  items: readonly NavItem[]
}

export const siteConfig = {
  name: 'Hieu UI Lab',
  description:
    'Reusable React components, UI blocks, and frontend engineering experiments, documented and tested.',
  githubUrl: 'https://github.com/PhanVanHieu-Ptit/HieuUiLab',
} as const

/** Top-level destinations in the header and mobile drawer. */
export const mainNav: readonly NavItem[] = [
  { title: 'Docs', href: '/docs' },
  { title: 'Components', href: '/components' },
  { title: 'Blocks', href: '/blocks', disabled: true, label: 'Soon' },
]

/** Documentation sidebar. Components are derived from the registry. */
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
        title: 'Theming',
        href: '/docs/theming',
        description: 'Design tokens, themes, and shared interaction states.',
      },
    ],
  },
  {
    title: 'Components',
    href: '/components',
    items: registry
      .filter((entry) => entry.category === 'component')
      .map((entry) => ({
        title: entry.name,
        href: `/components/${entry.slug}`,
        description: entry.description,
        status: entry.status,
      })),
  },
]

export interface Crumb {
  title: string
  href?: string
}

/** Breadcrumb trail for a docs path; empty when the path is not in the docs nav. */
export function getDocsBreadcrumbs(pathname: string): Crumb[] {
  const path = pathname.replace(/\/+$/, '') || '/'
  for (const section of docsNav) {
    if (section.href === path) return [{ title: 'Docs', href: '/docs' }, { title: section.title }]
    const item = section.items.find((candidate) => candidate.href === path)
    if (!item) continue
    return [
      { title: 'Docs', href: '/docs' },
      section.href ? { title: section.title, href: section.href } : { title: section.title },
      { title: item.title },
    ]
  }
  return []
}
