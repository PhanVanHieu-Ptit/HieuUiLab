import type { ImplementedEntry } from '../types'

export const tabsEntry: ImplementedEntry = {
  id: 'tabs',
  slug: 'tabs',
  name: 'Tabs',
  description:
    'Radix Tabs with line and pill styles. Arrow keys move between tabs; the list scrolls instead of overflowing on small screens.',
  kind: 'component',
  category: 'navigation',
  tags: ['keyboard', 'radix', 'responsive', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/tabs.tsx',
    packages: ['class-variance-authority', 'radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Name the group with `aria-label` (or `aria-labelledby`) on `TabsList`.',
    'Tab moves into the list and then to the panel; arrow keys move between tabs, and Home and End jump to the ends. Disabled tabs are skipped.',
    'By default a tab is selected as soon as it receives focus. Set `activationMode="manual"` when showing a panel is slow, so people can arrow past tabs and press Enter or Space to choose.',
    'Tabs switch views within a page. For navigation between URLs, use links in a nav instead.',
  ],
  api: {
    parts: [
      {
        name: 'Tabs',
        description: 'Root; holds the selected value.',
        props: [
          {
            name: 'variant',
            type: "'line' | 'pill'",
            default: "'line'",
            description: 'Style shared by the list and triggers.',
          },
          {
            name: 'defaultValue / value',
            type: 'string',
            description: 'Initially selected (uncontrolled) or selected (controlled) tab.',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void',
            description: 'Called when the selected tab changes; pair with value to control it.',
          },
          {
            name: 'activationMode',
            type: "'automatic' | 'manual'",
            default: "'automatic'",
            description: 'Select on focus, or only on Enter or Space.',
          },
          {
            name: 'orientation',
            type: "'horizontal' | 'vertical'",
            default: "'horizontal'",
            description: 'Which arrow keys move between tabs.',
          },
        ],
      },
      {
        name: 'TabsList',
        props: [
          {
            name: 'aria-label',
            type: 'string',
            description: 'Names the tab group for assistive tech.',
          },
        ],
      },
      {
        name: 'TabsTrigger',
        props: [
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Prevents selection.',
          },
          {
            name: 'value',
            type: 'string',
            required: true,
            description: 'Matches the TabsContent it controls.',
          },
        ],
      },
      {
        name: 'TabsContent',
        props: [
          {
            name: 'value',
            type: 'string',
            required: true,
            description: 'Matches its TabsTrigger.',
          },
          {
            name: 'forceMount',
            type: 'true',
            description: 'Keep the panel mounted while inactive (hidden), e.g. to preserve state.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
