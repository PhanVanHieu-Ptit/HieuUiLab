import checkboxSource from '@/components/ui/checkbox.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { CheckboxDemo, CheckboxSelectAllDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const checkboxEntry: ImplementedEntry = {
  id: 'checkbox',
  slug: 'checkbox',
  name: 'Checkbox',
  description:
    'A tri-state checkbox on Radix Checkbox: checked, unchecked, or indeterminate, toggled with Space, and submitted with native forms.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'keyboard', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/checkbox.tsx',
    packages: ['class-variance-authority', 'lucide-react', 'radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  source: checkboxSource,
  examples: [
    {
      id: 'basic',
      title: 'Uncontrolled',
      description: 'Each checkbox is named by its label; clicking the label toggles it.',
      component: CheckboxDemo,
      code: demoCode('CheckboxDemo'),
    },
    {
      id: 'select-all',
      title: 'Controlled select all',
      description:
        'The parent is indeterminate (aria-checked="mixed") while only some children are checked.',
      component: CheckboxSelectAllDemo,
      code: demoCode('CheckboxSelectAllDemo'),
    },
  ],
  guidelines: [
    'Use a Checkbox for choices that take effect when a form is submitted; use a Switch for settings that apply immediately.',
    'Group related checkboxes in a `fieldset` with a `legend` so the group has a name.',
    'The box is 16px; keep the Label next to it so the label extends the click target past the 24px minimum.',
    '`onCheckedChange` receives `true`, `false`, or `"indeterminate"`; compare with `=== true` when you need a boolean.',
  ],
  api: {
    parts: [
      {
        name: 'Checkbox',
        props: [
          {
            name: 'checked / onCheckedChange',
            type: "boolean | 'indeterminate' / (checked: boolean | 'indeterminate') => void",
            description: 'Controlled state and its change handler.',
          },
          {
            name: 'defaultChecked',
            type: "boolean | 'indeterminate'",
            default: 'false',
            description: 'Initial state when uncontrolled.',
          },
          {
            name: 'size',
            type: "'sm' | 'md'",
            default: "'md'",
            description: 'Box size.',
          },
          {
            name: 'name / value',
            type: 'string',
            default: "value: 'on'",
            description: 'Submitted as name=value with a surrounding form when checked.',
          },
          {
            name: 'disabled / required',
            type: 'boolean',
            default: 'false',
            description: 'Native form constraints.',
          },
          {
            name: '...props',
            type: 'ComponentProps<typeof Checkbox.Root>',
            description: 'Native button attributes, including ref (React 19).',
          },
        ],
      },
    ],
  },
}
