import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const cardEntry: ImplementedEntry = {
  id: 'card',
  slug: 'card',
  name: 'Card',
  description:
    'A bordered surface for grouped content, with header, title, description, content, and footer parts and a whole-card link variant.',
  kind: 'component',
  category: 'layout',
  tags: ['composition', 'polymorphic', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/card.tsx',
    packages: ['class-variance-authority', 'radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  api: {
    parts: [
      {
        name: 'Card',
        props: [
          {
            name: 'variant',
            type: "'default' | 'interactive' | 'dashed'",
            default: "'default'",
            description: 'Interactive adds hover and focus states for use with CardLink.',
          },
          nativeProps('div'),
        ],
      },
      {
        name: 'CardTitle',
        props: [
          {
            name: 'as',
            type: "'h2' | 'h3' | 'h4' | 'p'",
            default: "'h3'",
            description: 'Heading level that fits the page outline.',
          },
        ],
      },
      {
        name: 'CardLink',
        props: [
          {
            name: 'asChild',
            type: 'boolean',
            default: 'false',
            description: 'Merge onto a child such as a router Link.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
