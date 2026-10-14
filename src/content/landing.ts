import type { Capability } from './types'

/** The three things the lab does, in the order the hero promises them. */
export const capabilities: readonly Capability[] = [
  {
    title: 'Build reusable interfaces',
    description:
      'Accessible components and composed UI blocks with live previews, copyable source, and props references.',
    href: '/components',
    linkLabel: 'Explore components',
  },
  {
    title: 'Engineer reliable frontend systems',
    description:
      'Typed data flow, explicit loading and failure states, and tests that run at every layer, from tokens to end-to-end.',
    href: '/projects',
    linkLabel: 'Read the case studies',
  },
  {
    title: 'Share practical engineering knowledge',
    description:
      'Short notes on the decisions behind the code: what was tried, why it works, and where it falls short.',
    href: '/notes',
    linkLabel: 'Browse notes',
  },
]

export const featuredComponentSlugs: readonly string[] = ['button', 'tabs', 'dialog']
export const featuredBlockSlugs: readonly string[] = [
  'orders-dashboard',
  'data-table',
  'confirm-action',
]
export const featuredProjectSlugs: readonly string[] = [
  'contrast-tested-design-system',
  'registry-driven-documentation',
]
export const recentNotesCount = 3
