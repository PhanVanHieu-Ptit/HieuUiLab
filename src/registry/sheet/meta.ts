import type { ImplementedEntry } from '../types'

export const sheetEntry: ImplementedEntry = {
  id: 'sheet',
  slug: 'sheet',
  name: 'Sheet',
  description:
    'A modal drawer that slides in from the left or right edge. Built on Radix Dialog: focus trap, Escape to close, focus returns to the trigger.',
  kind: 'component',
  category: 'overlays',
  tags: ['focus-trap', 'modal', 'radix', 'responsive'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/sheet.tsx',
    packages: ['class-variance-authority', 'radix-ui', 'lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  api: {
    parts: [
      {
        name: 'Sheet',
        description: 'Root; holds the open state.',
        props: [
          {
            name: 'open / onOpenChange',
            type: 'boolean / (open: boolean) => void',
            description: 'Controlled open state (optional).',
          },
        ],
      },
      {
        name: 'SheetContent',
        description: 'The sliding panel, rendered in a portal over an overlay.',
        props: [
          {
            name: 'side',
            type: "'left' | 'right'",
            default: "'left'",
            description: 'Edge the panel slides in from.',
          },
          {
            name: 'aria-describedby',
            type: 'string | undefined',
            description:
              'Pass undefined when there is no SheetDescription, to opt out of the Radix warning.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
