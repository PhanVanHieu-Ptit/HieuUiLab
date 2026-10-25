import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const emptyStateEntry: ImplementedEntry = {
  id: 'empty-state',
  slug: 'empty-state',
  name: 'Empty state',
  description:
    'A centered message for empty, unavailable, or no-results content, with an optional icon and recovery actions.',
  kind: 'block',
  category: 'feedback',
  tags: ['composition', 'status'],
  status: 'stable',
  installation: {
    targetPath: 'components/blocks/empty-state.tsx',
    packages: [],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  api: {
    parts: [
      {
        name: 'EmptyState',
        props: [
          {
            name: 'title',
            type: 'ReactNode',
            required: true,
            description: 'Short statement of what is missing.',
          },
          {
            name: 'description',
            type: 'ReactNode',
            description: 'Why it is empty, or what to do.',
          },
          {
            name: 'icon',
            type: 'ReactNode',
            description: 'Decorative icon, hidden from screen readers.',
          },
          {
            name: 'actions',
            type: 'ReactNode',
            description: 'Buttons or links for the next step.',
          },
          {
            name: 'headingLevel',
            type: "'h2' | 'h3' | 'h4' | 'p'",
            default: "'h3'",
            description: 'Element for the title, to fit the surrounding outline.',
          },
          nativeProps('div'),
        ],
      },
    ],
  },
  content: () => import('./content'),
}
