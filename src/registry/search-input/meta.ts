import type { ImplementedEntry } from '../types'

export const searchInputEntry: ImplementedEntry = {
  id: 'search-input',
  slug: 'search-input',
  name: 'Search input',
  description:
    'A native search field (role searchbox) with a search icon and an optional clear button that returns focus to the input.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'keyboard'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/search-input.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['input'],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Put it in a `<form role="search">` so it is reachable as a search landmark.',
    'The clear button only appears for a controlled, non-empty `value` with `onClear`.',
    'Announce result counts in a separate `role="status"` region, not on every keystroke inside the input.',
  ],
  api: {
    parts: [
      {
        name: 'SearchInput',
        props: [
          {
            name: 'onClear',
            type: '() => void',
            description: 'Shows the clear button and handles Escape. Set the value to "" in it.',
          },
          {
            name: 'clearLabel',
            type: 'string',
            default: "'Clear search'",
            description: 'Accessible name of the clear button.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Styles the wrapper; use it for width.',
          },
          {
            name: '...props',
            type: "Omit<InputProps, 'type'>",
            description: 'Input attributes and ref, passed to the <input>.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
