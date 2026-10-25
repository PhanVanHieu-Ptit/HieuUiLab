import kbdSource from '@/components/ui/kbd.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { KbdDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: kbdSource,
  examples: [
    { id: 'basic', title: 'Shortcut hints', component: KbdDemo, code: demoCode('KbdDemo') },
  ],
}
