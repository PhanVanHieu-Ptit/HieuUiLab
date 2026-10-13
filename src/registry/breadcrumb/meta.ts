import breadcrumbSource from '@/components/ui/breadcrumb.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor } from '../utils'
import { BreadcrumbDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const breadcrumbEntry: RegistryEntry = {
  slug: 'breadcrumb',
  name: 'Breadcrumb',
  description:
    'A labelled navigation trail. The current page is marked with aria-current, separators are hidden from assistive tech, and items wrap on narrow screens.',
  category: 'component',
  status: 'stable',
  dependencies: ['clsx', 'tailwind-merge', 'radix-ui', 'lucide-react'],
  targetPath: 'components/ui/breadcrumb.tsx',
  source: breadcrumbSource,
  demos: [
    { id: 'basic', title: 'Basic', component: BreadcrumbDemo, code: demoCode('BreadcrumbDemo') },
  ],
  props: [
    {
      name: 'aria-label',
      type: 'string',
      default: "'Breadcrumb'",
      description: 'Breadcrumb: name of the navigation landmark.',
    },
    {
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'BreadcrumbLink: merge onto a child such as a router Link.',
    },
    {
      name: 'children',
      type: 'ReactNode',
      default: '<ChevronRight />',
      description: 'BreadcrumbSeparator: custom separator glyph.',
    },
  ],
}
