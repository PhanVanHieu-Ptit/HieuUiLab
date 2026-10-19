import { templateSlugs, type TemplateSlug } from './templates'
import type { Capability } from './types'

/** The three things the lab does, in the order the hero promises them. */
export const capabilities: readonly Capability[] = [
  {
    title: 'Build reusable interfaces',
    description:
      'Accessible components, composed UI blocks, and example apps built from them, with live previews, copyable source, and props references.',
    href: '/components',
    linkLabel: 'Explore components',
  },
  {
    title: 'Engineer reliable frontend systems',
    description:
      'Typed data flow, explicit loading and failure states, and tests that run at every layer, from tokens to end-to-end.',
    href: '/projects',
    linkLabel: 'See projects and case studies',
  },
  {
    title: 'Share practical engineering knowledge',
    description:
      'Articles on the decisions behind the code: the alternatives considered, how each was checked, and what was not.',
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
export const featuredTemplateSlugs: readonly TemplateSlug[] = templateSlugs
export const featuredShowcaseSlugs: readonly string[] = [
  'hieu-ui-lab-platform',
  'hieu-ui-lab-component-library',
  'geospatial-3d-experiments',
]
export const featuredProjectSlugs: readonly string[] = [
  'contrast-tested-design-system',
  'registry-driven-documentation',
]
export const recentNotesCount = 3
