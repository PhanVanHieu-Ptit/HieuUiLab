import resourceListSource from '@/components/blocks/resource-list.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor } from '../utils'
import { ResourceListDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const resourceListEntry: RegistryEntry = {
  slug: 'resource-list',
  name: 'Resource list',
  description:
    'A list for remote data that renders loading, error, empty, and ready states explicitly, with an announced loading status and a retry action.',
  category: 'block',
  status: 'beta',
  dependencies: ['clsx', 'tailwind-merge', 'lucide-react'],
  registryDependencies: ['empty-state', 'button', 'skeleton'],
  targetPath: 'components/blocks/resource-list.tsx',
  source: resourceListSource,
  demos: [
    {
      id: 'states',
      title: 'States',
      description: 'Switch between the four states. The error state retries into the ready state.',
      component: ResourceListDemo,
      code: demoCode('ResourceListDemo'),
    },
  ],
  props: [
    {
      name: 'state',
      type: "{ status: 'loading' } | { status: 'error'; message? } | { status: 'ready'; items }",
      description: 'Current state of the collection. Ready with no items renders the empty state.',
    },
    {
      name: 'label',
      type: 'string',
      description: 'Plural noun for the collection; used in messages and the list label.',
    },
    { name: 'getKey', type: '(item: T) => string', description: 'Stable key for each item.' },
    { name: 'renderItem', type: '(item: T) => ReactNode', description: 'Content of each row.' },
    {
      name: 'empty',
      type: '{ title?; description?; action? }',
      description: 'Overrides for the empty state.',
    },
    { name: 'onRetry', type: '() => void', description: 'Shows a retry button on error.' },
    { name: 'skeletonRows', type: 'number', default: '3', description: 'Rows while loading.' },
  ],
}
