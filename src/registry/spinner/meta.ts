import { Spinner } from '@/components/ui/spinner'
import spinnerSource from '@/components/ui/spinner.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { SpinnerDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

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
  source: spinnerSource,
  examples: [
    { id: 'basic', title: 'Basic', component: SpinnerDemo, code: demoCode('SpinnerDemo') },
  ],
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
  playground: definePlayground(Spinner, {
    part: 'Spinner',
    controls: [{ kind: 'text', prop: 'label', default: 'Loading' }],
  }),
}
