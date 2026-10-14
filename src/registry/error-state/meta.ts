import errorStateSource from '@/components/blocks/error-state.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { ErrorStateDemo, ErrorStatePlainDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const errorStateEntry: ImplementedEntry = {
  id: 'error-state',
  slug: 'error-state',
  name: 'Error state',
  description:
    'An Empty state for failures: announced as an alert, with a retry action and room for other ways forward.',
  kind: 'block',
  category: 'feedback',
  tags: ['a11y', 'async', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/error-state.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['empty-state', 'button'],
    requirements: ['design-tokens'],
  },
  source: errorStateSource,
  examples: [
    {
      id: 'retry',
      title: 'With retry',
      description: 'The retry comes first; other actions follow it.',
      component: ErrorStateDemo,
      code: demoCode('ErrorStateDemo'),
    },
    {
      id: 'no-retry',
      title: 'Without retry',
      description: 'When retrying cannot help, explain what the user can do instead.',
      component: ErrorStatePlainDemo,
      code: demoCode('ErrorStatePlainDemo'),
    },
  ],
  guidelines: [
    'Say what failed in the title and what to do next in the description. Avoid error codes unless the user can act on them.',
    'Offer onRetry only when retrying can succeed, e.g. after a timeout, not after a 404.',
    'The container has role="alert" so the failure is announced when it appears. Render it only after a real failure, not on page load.',
    'Resource list and Data table use it for their error states.',
  ],
  api: {
    parts: [
      {
        name: 'ErrorState',
        props: [
          {
            name: 'title',
            type: 'ReactNode',
            default: "'Something went wrong'",
            description: 'What failed.',
          },
          {
            name: 'description',
            type: 'ReactNode',
            default: "'Check your connection, then try again.'",
            description: 'What to do next.',
          },
          { name: 'onRetry', type: '() => void', description: 'Shows a retry button.' },
          {
            name: 'retryLabel',
            type: 'string',
            default: "'Try again'",
            description: 'Retry button label.',
          },
          { name: 'actions', type: 'ReactNode', description: 'Further actions after retry.' },
          {
            name: 'headingLevel',
            type: "'h2' | 'h3' | 'h4' | 'p'",
            default: "'h3'",
            description: 'Heading level of the title.',
          },
        ],
      },
    ],
  },
}
