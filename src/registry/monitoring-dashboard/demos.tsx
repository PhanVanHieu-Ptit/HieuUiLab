import { useState } from 'react'

import {
  MonitoringDashboard,
  type MonitoringDashboardState,
} from '@/components/blocks/monitoring-dashboard'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import { mockDelay } from '../mock-delay'
import { checkedAt, checkedAtAfter, healthyServices, incidents, services } from './mock-data'

type MockState = 'ready' | 'quiet' | 'empty' | 'loading' | 'error' | 'refresh-fails'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'With incidents' },
  { value: 'quiet', label: 'All operational' },
  { value: 'empty', label: 'No services' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
  { value: 'refresh-fails', label: 'Refresh fails' },
]

export function MonitoringDashboardDemo() {
  const [refreshes, setRefreshes] = useState(0)

  return (
    <MonitoringDashboard
      state={{ status: 'ready', services, incidents, checkedAt: checkedAtAfter(refreshes) }}
      onRefresh={async () => {
        await mockDelay(600)
        setRefreshes((count) => count + 1)
      }}
    />
  )
}

export function MonitoringDashboardStatesDemo() {
  const [mock, setMock] = useState<MockState>('quiet')

  const state: MonitoringDashboardState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the status service did not respond.' }
        : {
            status: 'ready',
            services: mock === 'empty' ? [] : mock === 'quiet' ? healthyServices : services,
            incidents: mock === 'quiet' || mock === 'empty' ? [] : incidents,
            checkedAt,
          }

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>
        Nothing is being monitored: the services, readings, and incidents are invented.
      </ExampleOnlyNotice>
      <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
      <MonitoringDashboard
        state={state}
        onRetry={() => {
          setMock('ready')
        }}
        onRefresh={async () => {
          await mockDelay(500)
          if (mock === 'refresh-fails') throw new Error('Mock: the status service did not respond.')
        }}
      />
    </div>
  )
}
