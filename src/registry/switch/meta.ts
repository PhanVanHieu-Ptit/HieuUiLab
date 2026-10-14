import switchSource from '@/components/ui/switch.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { SwitchControlledDemo, SwitchDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const switchEntry: ImplementedEntry = {
  id: 'switch',
  slug: 'switch',
  name: 'Switch',
  description:
    'An on/off toggle on Radix Switch for settings that apply immediately. Toggled with Space or Enter.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'keyboard', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/switch.tsx',
    packages: ['class-variance-authority', 'radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  source: switchSource,
  examples: [
    {
      id: 'basic',
      title: 'Uncontrolled',
      component: SwitchDemo,
      code: demoCode('SwitchDemo'),
    },
    {
      id: 'controlled',
      title: 'Controlled setting',
      description: 'The hint is linked with aria-describedby and reflects the current state.',
      component: SwitchControlledDemo,
      code: demoCode('SwitchControlledDemo'),
    },
  ],
  guidelines: [
    'Use a Switch when the change applies immediately; inside a form that is saved later, use a Checkbox.',
    'Keep the label constant ("Autosave"), not a description of the state ("On"); the switch already announces on or off.',
    'The thumb slide uses a CSS transition, so it stops animating under `prefers-reduced-motion`.',
  ],
  api: {
    parts: [
      {
        name: 'Switch',
        props: [
          {
            name: 'checked / onCheckedChange',
            type: 'boolean / (checked: boolean) => void',
            description: 'Controlled state and its change handler.',
          },
          {
            name: 'defaultChecked',
            type: 'boolean',
            default: 'false',
            description: 'Initial state when uncontrolled.',
          },
          {
            name: 'size',
            type: "'sm' | 'md'",
            default: "'md'",
            description: 'Track and thumb size.',
          },
          {
            name: 'name / value',
            type: 'string',
            default: "value: 'on'",
            description: 'Submitted as name=value with a surrounding form when on.',
          },
          {
            name: '...props',
            type: 'ComponentProps<typeof Switch.Root>',
            description: 'Native button attributes, including ref (React 19).',
          },
        ],
      },
    ],
  },
}
