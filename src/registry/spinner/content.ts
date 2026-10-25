import { Spinner } from '@/components/ui/spinner'
import spinnerSource from '@/components/ui/spinner.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SpinnerDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: spinnerSource,
  examples: [
    { id: 'basic', title: 'Basic', component: SpinnerDemo, code: demoCode('SpinnerDemo') },
  ],
  playground: definePlayground(Spinner, {
    part: 'Spinner',
    controls: [{ kind: 'text', prop: 'label', default: 'Loading' }],
  }),
}
