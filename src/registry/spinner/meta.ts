import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const spinnerEntry: ImplementedEntry = {
  id: 'spinner',
  slug: 'spinner',
  name: 'Spinner',
  description: 'An indeterminate loading indicator with role="status" and a screen-reader label.',
  kind: 'component',
  category: 'feedback',
  tags: ['a11y', 'loading', 'status'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/spinner.tsx',
    packages: ['lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  api: {
    parts: [
      {
        name: 'Spinner',
        props: [
          {
            name: 'label',
            type: 'string',
            default: "'Loading'",
            description: 'Text announced to screen readers.',
          },
          nativeProps('span'),
        ],
      },
    ],
  },
  content: () => import('./content'),
}
