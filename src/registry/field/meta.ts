import fieldSource from '@/components/ui/field.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { FieldControlsDemo, FieldDemo, FieldErrorDemo, FieldSetDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

const stateProps = [
  {
    name: 'invalid',
    type: 'boolean',
    description: 'Sets aria-invalid on the control. Defaults to whether a FieldError has content.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Disables the control and dims the label.',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description:
      'Shows the required marker and sets aria-required. Native required is left to the form.',
  },
]

export const fieldEntry: ImplementedEntry = {
  id: 'field',
  slug: 'field',
  name: 'Field',
  description:
    'Wires any control to its label, helper text, and error with generated ids, aria-describedby, and aria-invalid. Works with or without a form library.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'composition', 'form', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/field.tsx',
    packages: ['lucide-react', 'radix-ui'],
    registryDependencies: ['label'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: fieldSource,
  examples: [
    {
      id: 'basic',
      title: 'Label and helper text',
      description: 'The description is linked to the input; the label shows the required marker.',
      component: FieldDemo,
      code: demoCode('FieldDemo'),
    },
    {
      id: 'error',
      title: 'Field-level error',
      description:
        'Plain React state: rendering a FieldError marks the input invalid and adds the message to its description.',
      component: FieldErrorDemo,
      code: demoCode('FieldErrorDemo'),
    },
    {
      id: 'controls',
      title: 'Every control',
      description:
        'Textarea, Select, a native date input, Switch, and Checkbox share the same wiring.',
      component: FieldControlsDemo,
      code: demoCode('FieldControlsDemo'),
      preview: { height: 'lg' },
    },
    {
      id: 'fieldset',
      title: 'Group with one error',
      description: 'FieldSet names the group with its legend and links the group’s error to it.',
      component: FieldSetDemo,
      code: demoCode('FieldSetDemo'),
    },
  ],
  guidelines: [
    'Wrap the focusable element in `FieldControl`: the Input itself, or the `SelectTrigger` inside a Select.',
    'Validation belongs to your form logic or schema. Field only displays the result, so keep `required`, `maxLength`, and patterns out of the markup.',
    'Errors are not live regions. On a failed submit, move focus to the first invalid control so its error is read as its description.',
    'For a group of checkboxes, use `FieldSet` with a `FieldLegend`, and give each checkbox its own horizontal `Field`.',
    'For dates, a native `<Input type="date">` is keyboard-accessible and localised by the browser; no date library is needed.',
  ],
  api: {
    parts: [
      {
        name: 'Field',
        props: [
          ...stateProps,
          {
            name: 'orientation',
            type: "'vertical' | 'horizontal'",
            default: "'vertical'",
            description: 'Horizontal puts a Checkbox or Switch before its label.',
          },
          {
            name: 'controlId',
            type: 'string',
            description: 'Id for the control; generated when omitted.',
          },
        ],
      },
      {
        name: 'FieldControl',
        description:
          'Merges id, aria-describedby, aria-invalid, aria-required, and disabled onto its child. useFieldControlProps() returns the same attributes.',
        props: [
          {
            name: 'children',
            type: 'ReactElement',
            required: true,
            description: 'The single focusable element.',
          },
        ],
      },
      {
        name: 'FieldSet',
        description: 'A fieldset whose description and error describe the whole group.',
        props: stateProps,
      },
      {
        name: 'FieldLabel / FieldLegend / FieldDescription / FieldError',
        props: [
          {
            name: 'children',
            type: 'ReactNode',
            description: 'FieldError renders nothing when this is empty.',
          },
        ],
      },
    ],
  },
}
