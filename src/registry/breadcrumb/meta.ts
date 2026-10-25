import type { ImplementedEntry } from '../types'

export const breadcrumbEntry: ImplementedEntry = {
  id: 'breadcrumb',
  slug: 'breadcrumb',
  name: 'Breadcrumb',
  description:
    'A labelled navigation trail. The current page is marked with aria-current, separators are hidden from assistive tech, and items wrap on narrow screens.',
  kind: 'component',
  category: 'navigation',
  tags: ['a11y', 'polymorphic', 'responsive'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/breadcrumb.tsx',
    packages: ['radix-ui', 'lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  api: {
    parts: [
      {
        name: 'Breadcrumb',
        props: [
          {
            name: 'aria-label',
            type: 'string',
            default: "'Breadcrumb'",
            description: 'Name of the navigation landmark.',
          },
        ],
      },
      {
        name: 'BreadcrumbLink',
        props: [
          {
            name: 'asChild',
            type: 'boolean',
            default: 'false',
            description: 'Merge onto a child such as a router Link.',
          },
        ],
      },
      {
        name: 'BreadcrumbSeparator',
        props: [
          {
            name: 'children',
            type: 'ReactNode',
            default: '<ChevronRight />',
            description: 'Custom separator glyph.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
