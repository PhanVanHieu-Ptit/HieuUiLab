import confirmActionSource from '@/components/blocks/confirm-action.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor } from '../utils'
import { ConfirmActionDemo, ConfirmActionFailureDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const confirmActionEntry: RegistryEntry = {
  slug: 'confirm-action',
  name: 'Confirm action',
  description:
    'A destructive-action confirmation on Dialog. Async work keeps it open and busy; failures are shown inline so the user can retry.',
  category: 'block',
  status: 'beta',
  dependencies: ['clsx', 'tailwind-merge', 'radix-ui', 'lucide-react'],
  registryDependencies: ['dialog', 'button'],
  targetPath: 'components/blocks/confirm-action.tsx',
  source: confirmActionSource,
  demos: [
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
  props: [
    { name: 'trigger', type: 'ReactElement', description: 'Element that opens the dialog.' },
    { name: 'title', type: 'ReactNode', description: 'Question naming the action.' },
    { name: 'description', type: 'ReactNode', description: 'Consequences of confirming.' },
    { name: 'confirmLabel', type: 'string', description: 'Label of the destructive button.' },
    { name: 'cancelLabel', type: 'string', default: "'Cancel'", description: 'Cancel label.' },
    {
      name: 'onConfirm',
      type: '() => void | Promise<void>',
      description: 'Runs on confirm. The dialog closes when it resolves and stays open on reject.',
    },
  ],
}
