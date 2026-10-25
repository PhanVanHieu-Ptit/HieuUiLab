import type { ImplementedEntry } from '../types'

export const tooltipEntry: ImplementedEntry = {
  id: 'tooltip',
  slug: 'tooltip',
  name: 'Tooltip',
  description:
    'A short, non-interactive hint on Radix Tooltip. Opens on hover and keyboard focus, closes on Escape, and shares delays inside a provider.',
  kind: 'component',
  category: 'overlays',
  tags: ['a11y', 'keyboard', 'radix'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/tooltip.tsx',
    packages: ['radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  guidelines: [
    'A tooltip supplements, it never replaces: icon-only buttons still need an `aria-label`, and nothing important may live only in a tooltip.',
    'Tooltips do not open on touch screens. Anything a phone user needs must be visible or in the label.',
    'Keep content short and non-interactive. It cannot be reached with Tab; use a popover or dialog for links and buttons.',
    'The trigger must be focusable. Wrap a Button with `asChild`; a disabled button gets no pointer or focus events, so wrap it in a focusable `span` if it needs a hint.',
    'Wrap groups (toolbars, tables) in one `TooltipProvider` to share the open delay.',
    'A tooltip opened by keyboard focus stays open until blur, Escape, or activation, even if focusing the trigger scrolled the page. Radix alone would close it on that scroll.',
  ],
  api: {
    parts: [
      {
        name: 'TooltipProvider',
        description: 'Optional; shares delays between the tooltips inside it.',
        props: [
          {
            name: 'delayDuration',
            type: 'number',
            default: '400',
            description: 'Hover delay before opening, in ms. Keyboard focus opens immediately.',
          },
          {
            name: 'skipDelayDuration',
            type: 'number',
            default: '300',
            description: 'Window after closing in which the next tooltip opens without delay.',
          },
        ],
      },
      {
        name: 'Tooltip',
        description: 'Root; creates its own provider when none is above it.',
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
        ],
      },
      {
        name: 'TooltipTrigger',
        props: [
          {
            name: 'asChild',
            type: 'boolean',
            default: 'false',
            description: 'Merge trigger behaviour onto the single child, such as a Button.',
          },
        ],
      },
      {
        name: 'TooltipContent',
        description: 'The hint, portalled above the page with an arrow.',
        props: [
          {
            name: 'side',
            type: "'top' | 'right' | 'bottom' | 'left'",
            default: "'top'",
            description: 'Preferred side; flips when there is no room.',
          },
          {
            name: 'sideOffset',
            type: 'number',
            default: '6',
            description: 'Gap between trigger and tooltip, in px.',
          },
          {
            name: '...props',
            type: 'ComponentProps<typeof Tooltip.Content>',
            description: 'align, collisionPadding, and native div attributes.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
