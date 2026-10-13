import dialogSource from '@/components/ui/dialog.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor } from '../utils'
import { DialogDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const dialogEntry: RegistryEntry = {
  slug: 'dialog',
  name: 'Dialog',
  description:
    'A centered modal on Radix Dialog with overlay, focus trap, Escape to close, and a close button. The site search palette is built on it.',
  category: 'component',
  status: 'beta',
  dependencies: ['clsx', 'tailwind-merge', 'radix-ui', 'lucide-react'],
  targetPath: 'components/ui/dialog.tsx',
  source: dialogSource,
  demos: [
    { id: 'confirm', title: 'Confirmation', component: DialogDemo, code: demoCode('DialogDemo') },
  ],
  props: [
    {
      name: 'open / onOpenChange',
      type: 'boolean / (open: boolean) => void',
      description: 'Dialog: controlled open state (optional).',
    },
    {
      name: 'showClose',
      type: 'boolean',
      default: 'true',
      description: 'DialogContent: render the top-right close button.',
    },
  ],
}
