import separatorSource from '@/components/ui/separator.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor } from '../utils'
import { SeparatorDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const separatorEntry: RegistryEntry = {
  slug: 'separator',
  name: 'Separator',
  description: 'A horizontal or vertical rule. Decorative by default, so screen readers skip it.',
  category: 'component',
  status: 'stable',
  dependencies: ['clsx', 'tailwind-merge', 'radix-ui'],
  targetPath: 'components/ui/separator.tsx',
  source: separatorSource,
  demos: [
    {
      id: 'orientation',
      title: 'Orientation',
      component: SeparatorDemo,
      code: demoCode('SeparatorDemo'),
    },
  ],
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
}
