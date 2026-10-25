import type { ImplementedEntry } from '../types'

export const passwordInputEntry: ImplementedEntry = {
  id: 'password-input',
  slug: 'password-input',
  name: 'Password input',
  description:
    'An Input for passwords with a show/hide toggle that reports its state with aria-pressed.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'keyboard'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/password-input.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['input'],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  guidelines: [
    'Set `autoComplete` to `current-password` or `new-password` so password managers fill the right value.',
    'Never block pasting; it breaks password managers.',
    'The toggle keeps one accessible name and changes `aria-pressed`, so its label never contradicts its state.',
  ],
  api: {
    parts: [
      {
        name: 'PasswordInput',
        props: [
          {
            name: 'toggleLabel',
            type: 'string',
            default: "'Show password'",
            description: 'Accessible name of the visibility toggle.',
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
