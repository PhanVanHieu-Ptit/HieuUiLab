import { useState } from 'react'

import {
  DashboardOverview,
  type DashboardOverviewState,
} from '@/components/blocks/dashboard-overview'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import { activity, asOf, periods } from './mock-data'

type MockState = 'ready' | 'empty' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'With data' },
  { value: 'empty', label: 'No data' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

export function DashboardOverviewDemo() {
  return (
    <DashboardOverview
      state={{ status: 'ready', periods, activity }}
      asOf={asOf}
      description="Workspace usage, invented for this page."
    />
  )
}

export function DashboardOverviewStatesDemo() {
  const [mock, setMock] = useState<MockState>('loading')

  const state: DashboardOverviewState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the reporting service did not respond.' }
        : {
            status: 'ready',
            periods: mock === 'empty' ? {} : periods,
            activity: mock === 'empty' ? [] : activity,
          }

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>Every figure is invented and held in memory.</ExampleOnlyNotice>
      <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
      <DashboardOverview
        state={state}
        asOf={asOf}
        onRetry={() => {
          setMock('ready')
        }}
      />
    </div>
  )
}
