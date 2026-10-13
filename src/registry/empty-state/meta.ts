import emptyStateSource from '@/components/blocks/empty-state.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { EmptyStateDemo, EmptyStateSearchDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const emptyStateEntry: RegistryEntry = {
  slug: 'empty-state',
  name: 'Empty state',
  description:
    'A centered message for empty, unavailable, or no-results content, with an optional icon and recovery actions.',
  category: 'block',
  status: 'stable',
  dependencies: ['clsx', 'tailwind-merge'],
  targetPath: 'components/blocks/empty-state.tsx',
  source: emptyStateSource,
  demos: [
    {
      id: 'first-run',
      title: 'First run',
      description: 'Explain what belongs here and offer the next step.',
      component: EmptyStateDemo,
      code: demoCode('EmptyStateDemo'),
    },
    {
      id: 'no-results',
      title: 'No results',
      component: EmptyStateSearchDemo,
      code: demoCode('EmptyStateSearchDemo'),
    },
  ],
  props: [
    { name: 'title', type: 'ReactNode', description: 'Short statement of what is missing.' },
    { name: 'description', type: 'ReactNode', description: 'Why it is empty, or what to do.' },
    {
      name: 'icon',
      type: 'ReactNode',
      description: 'Decorative icon, hidden from screen readers.',
    },
    { name: 'actions', type: 'ReactNode', description: 'Buttons or links for the next step.' },
    {
      name: 'headingLevel',
      type: "'h2' | 'h3' | 'h4' | 'p'",
      default: "'h3'",
      description: 'Element for the title, to fit the surrounding outline.',
    },
    nativeProps('div'),
  ],
}
