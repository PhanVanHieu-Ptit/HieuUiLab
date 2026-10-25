import crudManagementPageSource from '@/components/blocks/crud-management-page.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import {
  CrudManagementPageDemo,
  CrudManagementPageFailuresDemo,
  CrudManagementPageStatesDemo,
} from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: crudManagementPageSource,
  examples: [
    {
      id: 'members',
      title: 'Members',
      description:
        'Example data, invented for this page: twelve people held in memory. Add, edit, and delete work until the page reloads. Nothing is sent.',
      component: CrudManagementPageDemo,
      code: demoCode('CrudManagementPageDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'failures',
      title: 'Rejected and failing saves',
      description:
        'Example only: pick what the mock service answers. The table never changes, so every failure can be repeated.',
      component: CrudManagementPageFailuresDemo,
      code: demoCode('CrudManagementPageFailuresDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Loading, empty, and error',
      description:
        'Example only: pick a mock state. Retry in the error state returns to the members.',
      component: CrudManagementPageStatesDemo,
      code: demoCode('CrudManagementPageStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
}
