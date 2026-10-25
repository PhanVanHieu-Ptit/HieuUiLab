import monitoringDashboardSource from '@/components/blocks/monitoring-dashboard.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { MonitoringDashboardDemo, MonitoringDashboardStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: monitoringDashboardSource,
  examples: [
    {
      id: 'status-board',
      title: 'Status board',
      description:
        'Example data, invented for this page: six services and four incidents. Refresh waits briefly and moves the “checked at” time on by a minute; no system is checked.',
      component: MonitoringDashboardDemo,
      code: demoCode('MonitoringDashboardDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Quiet, empty, loading, and error',
      description:
        'Example only: pick a mock state, including a refresh that fails. Retry in the error state returns to the board.',
      component: MonitoringDashboardStatesDemo,
      code: demoCode('MonitoringDashboardStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
}
