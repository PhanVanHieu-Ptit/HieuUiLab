import spinnerSource from '@/components/ui/spinner.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { SpinnerDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const spinnerEntry: RegistryEntry = {
  slug: 'spinner',
  name: 'Spinner',
  description: 'An indeterminate loading indicator with role="status" and a screen-reader label.',
  category: 'component',
  status: 'stable',
  dependencies: ['clsx', 'tailwind-merge', 'lucide-react'],
  targetPath: 'components/ui/spinner.tsx',
  source: spinnerSource,
  demos: [{ id: 'basic', title: 'Basic', component: SpinnerDemo, code: demoCode('SpinnerDemo') }],
  props: [
    {
      name: 'label',
      type: 'string',
      default: "'Loading'",
      description: 'Text announced to screen readers.',
    },
    nativeProps('span'),
  ],
}
