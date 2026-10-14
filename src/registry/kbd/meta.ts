import kbdSource from '@/components/ui/kbd.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { KbdDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const kbdEntry: ImplementedEntry = {
  id: 'kbd',
  slug: 'kbd',
  name: 'Kbd',
  description: 'A semantic <kbd> element for keys and shortcut hints.',
  kind: 'component',
  category: 'data-display',
  tags: ['keyboard'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/kbd.tsx',
    packages: [],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: kbdSource,
  examples: [
    { id: 'basic', title: 'Shortcut hints', component: KbdDemo, code: demoCode('KbdDemo') },
  ],
  api: { parts: [{ name: 'Kbd', props: [nativeProps('kbd')] }] },
}
