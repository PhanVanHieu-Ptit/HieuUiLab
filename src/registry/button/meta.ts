import { Button } from '@/components/ui/button'
import buttonSource from '@/components/ui/button.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { ButtonSizesDemo, ButtonStatesDemo, ButtonVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const buttonEntry: ImplementedEntry = {
  id: 'button',
  slug: 'button',
  name: 'Button',
  description:
    'An accessible button with variants, sizes, a loading state, and asChild composition for rendering links or other elements.',
  kind: 'component',
  category: 'actions',
  tags: ['a11y', 'loading', 'polymorphic', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/button.tsx',
    packages: ['class-variance-authority', 'radix-ui', 'lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
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
  guidelines: [
    'Use one default (primary) button per view; secondary, outline, and ghost for the rest.',
    'Icon-only buttons (`size="icon"`) need an `aria-label`; add a Tooltip for sighted mouse users.',
    'Use `asChild` with a link for navigation, so it is announced and behaves as a link.',
    'Buttons default to `type="button"`; set `type="submit"` explicitly in forms.',
    '`loading` disables the button and sets `aria-busy`. Keep the label (for example "Saving") so the purpose stays clear.',
  ],
  api: {
    parts: [
      {
        name: 'Button',
        props: [
          {
            name: 'variant',
            type: "'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'",
            default: "'default'",
            description: 'Visual style.',
          },
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg' | 'icon'",
            default: "'md'",
            description: 'Height and padding. Use icon for square icon-only buttons.',
          },
          {
            name: 'loading',
            type: 'boolean',
            default: 'false',
            description: 'Shows a spinner, sets aria-busy, and disables the button.',
          },
          {
            name: 'asChild',
            type: 'boolean',
            default: 'false',
            description:
              'Merges button props and styles onto its single child (e.g. a router link) instead of rendering a <button>.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Native disabled: not focusable and not clickable.',
          },
          {
            name: 'type',
            type: "'button' | 'submit' | 'reset'",
            default: "'button'",
            description: 'Defaults to button so it never submits a form unintentionally.',
          },
          nativeProps('button'),
        ],
      },
    ],
  },
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
