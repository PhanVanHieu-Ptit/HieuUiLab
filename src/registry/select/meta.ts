import type { ImplementedEntry } from '../types'

export const selectEntry: ImplementedEntry = {
  id: 'select',
  slug: 'select',
  name: 'Select',
  description:
    'A single-choice list on Radix Select with grouped options, typeahead, full keyboard support, and native form submission.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'keyboard', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/select.tsx',
    packages: ['class-variance-authority', 'lucide-react', 'radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Name the trigger with a Label (`htmlFor` pointing at the `SelectTrigger` id) or `aria-label`; the placeholder is not a name.',
    'Keyboard: Enter, Space, or the arrow keys open the list; arrows move; Enter selects; Escape closes and returns focus; typing jumps to a matching option.',
    'Item values must be non-empty strings. To allow clearing, use `value=""` on the root instead of an empty item, or add an explicit "None" item.',
    'For more than about 15 options, or when people need to type to filter, use a combobox instead.',
    'In a filter bar where a native `<select>` is enough, prefer it: it uses the platform picker on mobile.',
  ],
  api: {
    parts: [
      {
        name: 'Select',
        description: 'Root; holds the value and open state.',
        props: [
          {
            name: 'value / onValueChange',
            type: 'string / (value: string) => void',
            description: 'Controlled value and its change handler.',
          },
          {
            name: 'defaultValue',
            type: 'string',
            description: 'Initial value when uncontrolled.',
          },
          {
            name: 'open / onOpenChange',
            type: 'boolean / (open: boolean) => void',
            description: 'Controlled open state (optional).',
          },
          {
            name: 'name / required / disabled',
            type: 'string / boolean / boolean',
            description: 'Native form behaviour through a hidden select.',
          },
        ],
      },
      {
        name: 'SelectTrigger',
        description: 'The combobox button showing the current value.',
        props: [
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg'",
            default: "'md'",
            description: 'Height and padding, matching Input and Button.',
          },
          {
            name: 'aria-invalid',
            type: 'boolean',
            default: 'false',
            description: 'Applies the destructive border and ring.',
          },
          {
            name: '...props',
            type: 'ComponentProps<typeof Select.Trigger>',
            description: 'Native button attributes, including id and ref.',
          },
        ],
      },
      {
        name: 'SelectValue',
        props: [
          {
            name: 'placeholder',
            type: 'ReactNode',
            description: 'Shown, in muted text, while no value is selected.',
          },
        ],
      },
      {
        name: 'SelectContent',
        description: 'The listbox, portalled above the page.',
        props: [
          {
            name: 'position',
            type: "'popper' | 'item-aligned'",
            default: "'popper'",
            description:
              'popper anchors below the trigger at its width; item-aligned overlays the selected item on the trigger.',
          },
          {
            name: 'sideOffset',
            type: 'number',
            default: '4',
            description: 'Gap between trigger and list, in px (popper only).',
          },
        ],
      },
      {
        name: 'SelectItem',
        props: [
          {
            name: 'value',
            type: 'string',
            required: true,
            description: 'Non-empty value submitted and passed to onValueChange.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Shown dimmed and skipped by keyboard navigation.',
          },
          {
            name: 'textValue',
            type: 'string',
            description: 'Text used for typeahead when the children are not plain text.',
          },
        ],
      },
      {
        name: 'SelectGroup / SelectLabel / SelectSeparator',
        description: 'Group options under an accessible heading, and divide groups.',
        props: [
          {
            name: '...props',
            type: 'ComponentProps<typeof Select.Group | Label | Separator>',
            description: 'Native div attributes, including ref.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
