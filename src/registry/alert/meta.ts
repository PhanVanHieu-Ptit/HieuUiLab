import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const alertEntry: ImplementedEntry = {
  id: 'alert',
  slug: 'alert',
  name: 'Alert',
  description:
    'An inline message about the page or a task, with status variants, an optional icon, and a live-region role chosen by severity.',
  kind: 'component',
  category: 'feedback',
  tags: ['a11y', 'status', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/alert.tsx',
    packages: ['class-variance-authority'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  guidelines: [
    'The default role is `status` (polite); `destructive` uses `alert`, which interrupts the screen reader. Reserve it for errors that need attention now.',
    'For messages that are part of the page on load, pass `role="none"`; announcing them on every visit is noise.',
    'Screen readers announce `role="alert"` when it is inserted. Announcing a newly inserted `status` is less consistent; when a confirmation matters, keep the Alert mounted and change its text.',
    'Colour is never the only signal: the title states the status ("Error: …"), and icons are `aria-hidden`.',
    'An Alert does not take focus. If the user must act before continuing, use a Dialog.',
  ],
  api: {
    parts: [
      {
        name: 'Alert',
        props: [
          {
            name: 'variant',
            type: "'neutral' | 'info' | 'success' | 'warning' | 'destructive'",
            default: "'neutral'",
            description: 'Border, icon, and title colour.',
          },
          {
            name: 'role',
            type: 'AriaRole',
            default: "'status' ('alert' for destructive)",
            description: 'Live-region role. Pass none for static messages.',
          },
          nativeProps('div'),
        ],
      },
      {
        name: 'AlertTitle',
        description: 'A short summary; coloured by the variant.',
        props: [nativeProps('p')],
      },
      {
        name: 'AlertDescription',
        description: 'Supporting text; may contain paragraphs and links.',
        props: [nativeProps('div')],
      },
    ],
  },
  content: () => import('./content'),
}
