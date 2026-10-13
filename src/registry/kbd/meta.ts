import kbdSource from '@/components/ui/kbd.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { KbdDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const kbdEntry: RegistryEntry = {
  slug: 'kbd',
  name: 'Kbd',
  description: 'A semantic <kbd> element for keys and shortcut hints.',
  category: 'component',
  status: 'stable',
  dependencies: ['clsx', 'tailwind-merge'],
  targetPath: 'components/ui/kbd.tsx',
  source: kbdSource,
  demos: [{ id: 'basic', title: 'Shortcut hints', component: KbdDemo, code: demoCode('KbdDemo') }],
  props: [nativeProps('kbd')],
}
