import dialogSource from '@/components/ui/dialog.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { DialogDemo, DialogFormDemo, DialogScrollDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const dialogEntry: ImplementedEntry = {
  id: 'dialog',
  slug: 'dialog',
  name: 'Dialog',
  description:
    'A centered modal on Radix Dialog with overlay, focus trap, Escape to close, a close button, and a scrollable body. The site search palette is built on it.',
  kind: 'component',
  category: 'overlays',
  tags: ['focus-trap', 'keyboard', 'modal', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/dialog.tsx',
    packages: ['radix-ui', 'lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  source: dialogSource,
  examples: [
    {
      id: 'confirm',
      title: 'Confirmation',
      description: 'Uncontrolled. Focus moves into the dialog and returns to the trigger on close.',
      component: DialogDemo,
      code: demoCode('DialogDemo'),
    },
    {
      id: 'form',
      title: 'Controlled form',
      description:
        'The form wraps header, body, and footer; submitting saves and closes through open state.',
      component: DialogFormDemo,
      code: demoCode('DialogFormDemo'),
    },
    {
      id: 'scroll',
      title: 'Long content',
      description:
        'DialogBody scrolls while the header and footer stay in view, even on small screens.',
      component: DialogScrollDemo,
      code: demoCode('DialogScrollDemo'),
    },
  ],
  guidelines: [
    'Every dialog needs a `DialogTitle`. Add a `DialogDescription`, or pass `aria-describedby={undefined}` to `DialogContent` when there is none.',
    'Focus moves to the first focusable element on open, Tab stays inside, and Escape or the overlay closes it; focus then returns to the trigger. Use `onOpenAutoFocus` to focus a different element.',
    'Use a dialog when the user must respond before continuing. For non-blocking messages use an Alert; for side panels use a Sheet.',
    'Put the primary action last in `DialogFooter`. It is shown on the right on wide screens and on top when the footer stacks.',
    'To close after an async action, control `open` and set it to false when the work finishes.',
  ],
  api: {
    parts: [
      {
        name: 'Dialog',
        description: 'Root; holds the open state.',
        props: [
          {
            name: 'open / onOpenChange',
            type: 'boolean / (open: boolean) => void',
            description: 'Controlled open state (optional).',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            default: 'false',
            description: 'Initial open state when uncontrolled.',
          },
          {
            name: 'modal',
            type: 'boolean',
            default: 'true',
            description: 'Block interaction with the rest of the page and trap focus.',
          },
        ],
      },
      {
        name: 'DialogTrigger / DialogClose',
        description: 'Buttons that open or close the dialog.',
        props: [
          {
            name: 'asChild',
            type: 'boolean',
            default: 'false',
            description: 'Merge behaviour onto the single child, such as a Button.',
          },
        ],
      },
      {
        name: 'DialogContent',
        description: 'The modal panel, rendered in a portal over an overlay.',
        props: [
          {
            name: 'showClose',
            type: 'boolean',
            default: 'true',
            description: 'Render the top-right close button.',
          },
          {
            name: 'container',
            type: 'HTMLElement | null',
            default: 'document.body',
            description:
              'Portal into this element instead of the page body, e.g. to keep a dialog inside a preview frame.',
          },
          {
            name: 'onOpenAutoFocus / onCloseAutoFocus',
            type: '(event: Event) => void',
            description: 'Call event.preventDefault() to manage focus yourself.',
          },
          {
            name: 'onEscapeKeyDown / onInteractOutside',
            type: '(event: Event) => void',
            description: 'Call event.preventDefault() to keep the dialog open.',
          },
        ],
      },
      {
        name: 'DialogHeader / DialogBody / DialogFooter',
        description:
          'Layout regions. The body scrolls; the footer stacks its actions on narrow screens.',
        props: [nativeProps('div')],
      },
      {
        name: 'DialogTitle / DialogDescription',
        description: 'Name and describe the dialog through aria-labelledby and aria-describedby.',
        props: [
          {
            name: '...props',
            type: 'ComponentProps<typeof Dialog.Title | Dialog.Description>',
            description: 'Native heading and paragraph attributes.',
          },
        ],
      },
    ],
  },
}
