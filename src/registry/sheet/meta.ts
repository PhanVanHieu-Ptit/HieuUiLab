import sheetSource from '@/components/ui/sheet.tsx?raw'

import type { RegistryEntry } from '../types'
import { baseDependencies, demoExtractor } from '../utils'
import { SheetDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const sheetEntry: RegistryEntry = {
  slug: 'sheet',
  name: 'Sheet',
  description:
    'A modal drawer that slides in from the left or right edge. Built on Radix Dialog: focus trap, Escape to close, focus returns to the trigger.',
  category: 'component',
  status: 'beta',
  dependencies: [...baseDependencies, 'radix-ui', 'lucide-react'],
  targetPath: 'components/ui/sheet.tsx',
  source: sheetSource,
  demos: [
    {
      id: 'sides',
      title: 'Sides',
      description: 'The site uses the left sheet for mobile navigation.',
      component: SheetDemo,
      code: demoCode('SheetDemo'),
    },
  ],
  props: [
    {
      name: 'side',
      type: "'left' | 'right'",
      default: "'left'",
      description: 'SheetContent: edge the panel slides in from.',
    },
    {
      name: 'open / onOpenChange',
      type: 'boolean / (open: boolean) => void',
      description: 'Sheet: controlled open state (optional).',
    },
    {
      name: 'aria-describedby',
      type: 'string | undefined',
      description:
        'SheetContent: pass undefined when there is no SheetDescription, to opt out of the Radix warning.',
    },
  ],
}
