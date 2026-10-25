import type { ImplementedEntry } from '../types'

export const confirmActionEntry: ImplementedEntry = {
  id: 'confirm-action',
  slug: 'confirm-action',
  name: 'Confirm action',
  description:
    'A confirmation on Dialog, destructive by default. Async work keeps it open and busy; failures are shown inline so the user can retry.',
  kind: 'block',
  category: 'actions',
  tags: ['async', 'composition', 'focus-trap', 'modal'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/confirm-action.tsx',
    packages: [],
    registryDependencies: ['dialog', 'button'],
    requirements: ['design-tokens'],
  },
  api: {
    parts: [
      {
        name: 'ConfirmAction',
        props: [
          {
            name: 'trigger',
            type: 'ReactElement',
            required: true,
            description: 'Element that opens the dialog.',
          },
          {
            name: 'title',
            type: 'ReactNode',
            required: true,
            description: 'Question naming the action.',
          },
          {
            name: 'description',
            type: 'ReactNode',
            required: true,
            description: 'Consequences of confirming.',
          },
          {
            name: 'confirmLabel',
            type: 'string',
            required: true,
            description: 'Label of the confirm button.',
          },
          {
            name: 'confirmVariant',
            type: "'destructive' | 'default'",
            default: "'destructive'",
            description: 'Style of the confirm button.',
          },
          {
            name: 'cancelLabel',
            type: 'string',
            default: "'Cancel'",
            description: 'Cancel label.',
          },
          {
            name: 'onConfirm',
            type: '() => void | Promise<void>',
            required: true,
            description:
              'Runs on confirm. The dialog closes when it resolves and stays open on reject.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
