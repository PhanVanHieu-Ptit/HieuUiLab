import type { ImplementedEntry } from '../types'

export const inputEntry: ImplementedEntry = {
  id: 'input',
  slug: 'input',
  name: 'Input',
  description:
    'A native text input with the shared size scale, invalid and read-only styles, and every input attribute passed through.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/input.tsx',
    packages: ['class-variance-authority'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Always give it a visible Label. A placeholder is not a label: it disappears on input and is often low contrast.',
    'Show errors as text linked with `aria-describedby` and set `aria-invalid`; never signal an error with the border colour alone.',
    'Pick the `type`, `inputMode`, and `autoComplete` that match the data so mobile keyboards and autofill help.',
    'The native `size` attribute is replaced by the size scale; set width with `className`.',
  ],
  api: {
    parts: [
      {
        name: 'Input',
        props: [
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg'",
            default: "'md'",
            description: 'Height and padding, matching Button and SelectTrigger.',
          },
          {
            name: 'type',
            type: 'HTMLInputTypeAttribute',
            default: "'text'",
            description: 'Native input type.',
          },
          {
            name: 'value / defaultValue',
            type: 'string | number',
            description: 'Controlled (with onChange) or initial (uncontrolled) value.',
          },
          {
            name: 'aria-invalid',
            type: 'boolean',
            default: 'false',
            description: 'Marks the value as invalid and applies the destructive border and ring.',
          },
          {
            name: '...props',
            type: "Omit<ComponentProps<'input'>, 'size'>",
            description: 'All native input attributes except size, including ref (React 19).',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
