import type { ImplementedEntry } from '../types'

export const separatorEntry: ImplementedEntry = {
  id: 'separator',
  slug: 'separator',
  name: 'Separator',
  description: 'A horizontal or vertical rule. Decorative by default, so screen readers skip it.',
  kind: 'component',
  category: 'layout',
  tags: ['a11y', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/separator.tsx',
    packages: ['radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  api: {
    parts: [
      {
        name: 'Separator',
        props: [
          {
            name: 'orientation',
            type: "'horizontal' | 'vertical'",
            default: "'horizontal'",
            description: 'Direction of the rule.',
          },
          {
            name: 'decorative',
            type: 'boolean',
            default: 'true',
            description: 'Set false to expose it as role="separator" between meaningful groups.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
