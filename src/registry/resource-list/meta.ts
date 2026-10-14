import resourceListSource from '@/components/blocks/resource-list.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { ResourceListDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const resourceListEntry: ImplementedEntry = {
  id: 'resource-list',
  slug: 'resource-list',
  name: 'Resource list',
  description:
    'A list for remote data that renders loading, error, empty, and ready states explicitly, with an announced loading status and a retry action.',
  kind: 'block',
  category: 'data-display',
  tags: ['async', 'composition', 'loading', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/resource-list.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['empty-state', 'error-state', 'skeleton'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: resourceListSource,
  examples: [
    {
      id: 'states',
      title: 'States',
      description: 'Switch between the four states. The error state retries into the ready state.',
      component: ResourceListDemo,
      code: demoCode('ResourceListDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
  api: {
    parts: [
      {
        name: 'ResourceList',
        props: [
          {
            name: 'state',
            type: "{ status: 'loading' } | { status: 'error'; message? } | { status: 'ready'; items }",
            required: true,
            description:
              'Current state of the collection. Ready with no items renders the empty state.',
          },
          {
            name: 'label',
            type: 'string',
            required: true,
            description: 'Plural noun for the collection; used in messages and the list label.',
          },
          {
            name: 'getKey',
            type: '(item: T) => string',
            required: true,
            description: 'Stable key for each item.',
          },
          {
            name: 'renderItem',
            type: '(item: T) => ReactNode',
            required: true,
            description: 'Content of each row.',
          },
          {
            name: 'empty',
            type: '{ title?; description?; action? }',
            description: 'Overrides for the empty state.',
          },
          { name: 'onRetry', type: '() => void', description: 'Shows a retry button on error.' },
          {
            name: 'skeletonRows',
            type: 'number',
            default: '3',
            description: 'Rows while loading.',
          },
        ],
      },
    ],
  },
}
