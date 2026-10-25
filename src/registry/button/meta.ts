import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

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
  content: () => import('./content'),
}
