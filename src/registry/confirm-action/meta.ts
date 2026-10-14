import confirmActionSource from '@/components/blocks/confirm-action.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { ConfirmActionDemo, ConfirmActionFailureDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const confirmActionEntry: ImplementedEntry = {
  id: 'confirm-action',
  slug: 'confirm-action',
  name: 'Confirm action',
  description:
    'A destructive-action confirmation on Dialog. Async work keeps it open and busy; failures are shown inline so the user can retry.',
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
  source: confirmActionSource,
  examples: [
    {
      id: 'async',
      title: 'Async confirmation',
      description: 'The confirm button shows a busy state until the work finishes.',
      component: ConfirmActionDemo,
      code: demoCode('ConfirmActionDemo'),
    },
    {
      id: 'failure',
      title: 'Failure and retry',
      description: 'A rejected promise keeps the dialog open and announces the error.',
      component: ConfirmActionFailureDemo,
      code: demoCode('ConfirmActionFailureDemo'),
    },
  ],
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
            description: 'Label of the destructive button.',
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
}
