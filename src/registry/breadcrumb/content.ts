import breadcrumbSource from '@/components/ui/breadcrumb.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { BreadcrumbDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: breadcrumbSource,
  examples: [
    { id: 'basic', title: 'Basic', component: BreadcrumbDemo, code: demoCode('BreadcrumbDemo') },
  ],
}
