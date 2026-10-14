import labelSource from '@/components/ui/label.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { LabelControlsDemo, LabelDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const labelEntry: ImplementedEntry = {
  id: 'label',
  slug: 'label',
  name: 'Label',
  description:
    'A native label on Radix Label that names a form control, with a visual required marker and disabled dimming.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/label.tsx',
    packages: ['radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: labelSource,
  examples: [
    {
      id: 'required',
      title: 'Required field',
      description: 'The asterisk is hidden from screen readers; the input carries required.',
      component: LabelDemo,
      code: demoCode('LabelDemo'),
    },
    {
      id: 'controls',
      title: 'With checkboxes',
      description:
        'Clicking the label toggles the checkbox. A label after a disabled peer control dims.',
      component: LabelControlsDemo,
      code: demoCode('LabelControlsDemo'),
    },
  ],
  guidelines: [
    'Associate every label with its control through `htmlFor` and the control `id`, or by wrapping the control.',
    'The `required` marker is visual only. Put `required` (or `aria-required`) on the control itself.',
    'Disabled dimming works when the label follows a control with the `peer` class (Checkbox, Switch) or sits in a `group` with `data-disabled`.',
  ],
  api: {
    parts: [
      {
        name: 'Label',
        props: [
          {
            name: 'htmlFor',
            type: 'string',
            description: 'The id of the control this label names.',
          },
          {
            name: 'required',
            type: 'boolean',
            default: 'false',
            description: 'Show an aria-hidden required marker after the text.',
          },
          {
            name: '...props',
            type: 'ComponentProps<typeof Label.Root>',
            description: 'All native label attributes, including ref (React 19).',
          },
        ],
      },
    ],
  },
}
