import dialogSource from '@/components/ui/dialog.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { DialogDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const dialogEntry: ImplementedEntry = {
  id: 'dialog',
  slug: 'dialog',
  name: 'Dialog',
  description:
    'A centered modal on Radix Dialog with overlay, focus trap, Escape to close, and a close button. The site search palette is built on it.',
  kind: 'component',
  category: 'overlays',
  tags: ['focus-trap', 'keyboard', 'modal', 'radix'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/dialog.tsx',
    packages: ['radix-ui', 'lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  source: dialogSource,
  examples: [
    { id: 'confirm', title: 'Confirmation', component: DialogDemo, code: demoCode('DialogDemo') },
  ],
  api: {
    parts: [
      {
        name: 'Dialog',
        description: 'Root; holds the open state.',
        props: [
          {
            name: 'open / onOpenChange',
            type: 'boolean / (open: boolean) => void',
            description: 'Controlled open state (optional).',
          },
        ],
      },
      {
        name: 'DialogContent',
        description: 'The modal panel, rendered in a portal over an overlay.',
        props: [
          {
            name: 'showClose',
            type: 'boolean',
            default: 'true',
            description: 'Render the top-right close button.',
          },
        ],
      },
    ],
  },
}
