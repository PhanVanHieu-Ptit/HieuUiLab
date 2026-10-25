import dashboardOverviewSource from '@/components/blocks/dashboard-overview.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { DashboardOverviewDemo, DashboardOverviewStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: dashboardOverviewSource,
  examples: [
    {
      id: 'overview',
      title: 'Workspace usage',
      description:
        'Example data, invented for this page: a made-up workspace with figures for two ranges. Nothing is fetched.',
      component: DashboardOverviewDemo,
      code: demoCode('DashboardOverviewDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Loading, empty, and error',
      description:
        'Example only: pick a mock state to see each one. Retry in the error state returns to the data.',
      component: DashboardOverviewStatesDemo,
      code: demoCode('DashboardOverviewStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
}
