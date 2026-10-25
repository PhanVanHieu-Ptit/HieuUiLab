import { Button } from '@/components/ui/button'
import buttonSource from '@/components/ui/button.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { ButtonSizesDemo, ButtonStatesDemo, ButtonVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: buttonSource,
  examples: [
    {
      id: 'variants',
      title: 'Variants',
      component: ButtonVariantsDemo,
      code: demoCode('ButtonVariantsDemo'),
    },
    {
      id: 'sizes',
      title: 'Sizes',
      description: 'Icon-only buttons must have an accessible name via aria-label.',
      component: ButtonSizesDemo,
      code: demoCode('ButtonSizesDemo'),
    },
    {
      id: 'states',
      title: 'States and composition',
      description:
        'Loading sets aria-busy and disables the button. asChild renders the child element.',
      component: ButtonStatesDemo,
      code: demoCode('ButtonStatesDemo'),
    },
  ],
  playground: definePlayground(Button, {
    part: 'Button',
    controls: [
      { kind: 'text', prop: 'children', label: 'Label', default: 'Save changes' },
      {
        kind: 'select',
        prop: 'variant',
        options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
        default: 'default',
      },
      // icon is left out: a square button needs an icon child, not a text label.
      { kind: 'select', prop: 'size', options: ['sm', 'md', 'lg'], default: 'md' },
      { kind: 'boolean', prop: 'loading', default: false },
      { kind: 'boolean', prop: 'disabled', default: false },
    ],
  }),
}
