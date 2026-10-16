import { useState } from 'react'

import {
  NotificationCenter,
  type NotificationCenterState,
  type NotificationEntry,
} from '@/components/blocks/notification-center'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import { asOf, notifications } from './mock-data'

type MockState = 'ready' | 'all-read' | 'empty' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'Some unread' },
  { value: 'all-read', label: 'All read' },
  { value: 'empty', label: 'No notifications' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

function itemsFor(mock: MockState): readonly NotificationEntry[] {
  if (mock === 'empty') return []
  if (mock === 'all-read') return notifications.map((item) => ({ ...item, read: true }))
  return notifications
}

export function NotificationCenterDemo() {
  const [items, setItems] = useState<readonly NotificationEntry[]>(notifications)

  return (
    <NotificationCenter
      state={{ status: 'ready', items }}
      asOf={asOf}
      onMarkRead={(id) => {
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, read: true } : item)),
        )
      }}
      onMarkAllRead={() => {
        setItems((current) => current.map((item) => ({ ...item, read: true })))
      }}
    />
  )
}

export function NotificationCenterStatesDemo() {
  const [mock, setMock] = useState<MockState>('loading')
  const [items, setItems] = useState<readonly NotificationEntry[]>(notifications)
  const shown = mock === 'ready' ? items : itemsFor(mock)

  const state: NotificationCenterState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the notification service did not respond.' }
        : { status: 'ready', items: shown }

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>Notifications are invented and held in memory.</ExampleOnlyNotice>
      <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
      <NotificationCenter
        state={state}
        asOf={asOf}
        onRetry={() => {
          setMock('ready')
        }}
        onMarkRead={(id) => {
          setItems((current) =>
            current.map((item) => (item.id === id ? { ...item, read: true } : item)),
          )
        }}
        onMarkAllRead={() => {
          setItems((current) => current.map((item) => ({ ...item, read: true })))
        }}
      />
    </div>
  )
}
