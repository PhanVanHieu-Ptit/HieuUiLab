import buttonSource from '@/components/ui/button.tsx?raw'

import type { RegistryEntry } from '../types'
import { ButtonSizesDemo, ButtonStatesDemo, ButtonVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

/** Extract a single exported demo function from the demos file for display. */
function demoCode(name: string): string {
  const start = demosSource.indexOf(`export function ${name}`)
  if (start === -1) return demosSource
  const next = demosSource.indexOf('\nexport function ', start + 1)
  return demosSource.slice(start, next === -1 ? undefined : next).trim()
}

export const buttonEntry: RegistryEntry = {
  slug: 'button',
  name: 'Button',
  description:
    'An accessible button with variants, sizes, a loading state, and asChild composition for rendering links or other elements.',
  category: 'component',
  status: 'stable',
  dependencies: ['class-variance-authority', 'clsx', 'tailwind-merge', 'radix-ui', 'lucide-react'],
  targetPath: 'components/ui/button.tsx',
  source: buttonSource,
  demos: [
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
      name: 'type',
      type: "'button' | 'submit' | 'reset'",
      default: "'button'",
      description: 'Defaults to button so it never submits a form unintentionally.',
    },
    {
      name: '...props',
      type: "ComponentProps<'button'>",
      description: 'All native button attributes, including ref (React 19).',
    },
  ],
}
