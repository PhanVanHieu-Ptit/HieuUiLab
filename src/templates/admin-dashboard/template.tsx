import { Bell, LayoutDashboard, Settings } from 'lucide-react'
import { useState } from 'react'

import {
  DashboardOverview,
  type DashboardOverviewState,
} from '@/components/blocks/dashboard-overview'
import {
  NotificationCenter,
  type NotificationCenterState,
  type NotificationEntry,
} from '@/components/blocks/notification-center'
import {
  UserProfileSettings,
  type UserProfileSettingsState,
} from '@/components/blocks/user-profile-settings'
import { activity, asOf as overviewAsOf, periods } from '@/registry/dashboard-overview/mock-data'
import { ExampleOnlyNotice, MockPicker } from '@/registry/demo-controls'
import { asOf as notificationsAsOf, notifications } from '@/registry/notification-center/mock-data'
import {
  mockChangePassword,
  mockSavePreferences,
  mockSaveProfile,
  samplePreferences,
  sampleProfile,
} from '@/registry/user-profile-settings/mock-data'
import { TemplateShell } from '@/templates/shared/template-shell'

type ViewId = 'overview' | 'notifications' | 'settings'
type MockState = 'ready' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'Loaded' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

/**
 * An admin app: an overview, a notification inbox, and account settings. The range chosen on the
 * overview and the notifications are held here rather than in the blocks, so they survive moving
 * between views and the sidebar can show how many notifications are unread.
 */
export function AdminDashboardTemplate() {
  const [view, setView] = useState<ViewId>('overview')
  const [mock, setMock] = useState<MockState>('ready')
  const [range, setRange] = useState('7d')
  const [items, setItems] = useState<readonly NotificationEntry[]>(notifications)

  const unread = items.filter((item) => !item.read).length
  const retry = () => {
    setMock('ready')
  }
  const failure = (service: string) => `Mock: the ${service} service did not respond.`

  const overviewState: DashboardOverviewState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: failure('reporting') }
        : { status: 'ready', periods, activity }

  const notificationsState: NotificationCenterState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: failure('notification') }
        : { status: 'ready', items }

  const settingsState: UserProfileSettingsState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: failure('settings') }
        : { status: 'ready', profile: sampleProfile, notifications: samplePreferences }

  return (
    <TemplateShell
      appName="Workspace admin"
      activeView={view}
      onViewChange={setView}
      views={[
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard aria-hidden="true" /> },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Bell aria-hidden="true" />,
          ...(unread > 0
            ? { badge: { text: String(unread), label: `${String(unread)} unread` } }
            : {}),
        },
        { id: 'settings', label: 'Settings', icon: <Settings aria-hidden="true" /> },
      ]}
      controls={
        <div className="grid gap-3">
          <ExampleOnlyNotice>
            Every figure, name, and message is invented and held in memory. Nothing is saved or
            sent.
          </ExampleOnlyNotice>
          <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
        </div>
      }
    >
      {view === 'overview' ? (
        <DashboardOverview
          state={overviewState}
          asOf={overviewAsOf}
          description="Workspace usage, invented for this example."
          range={range}
          onRangeChange={setRange}
          onRetry={retry}
        />
      ) : null}
      {view === 'notifications' ? (
        <NotificationCenter
          state={notificationsState}
          asOf={notificationsAsOf}
          onRetry={retry}
          onMarkRead={(id) => {
            setItems((current) =>
              current.map((item) => (item.id === id ? { ...item, read: true } : item)),
            )
          }}
          onMarkAllRead={() => {
            setItems((current) => current.map((item) => ({ ...item, read: true })))
          }}
        />
      ) : null}
      {view === 'settings' ? (
        <UserProfileSettings
          state={settingsState}
          onRetry={retry}
          onSaveProfile={(values) => mockSaveProfile(values, 'success')}
          onSaveNotifications={(values) => mockSavePreferences(values, 'success')}
          onChangePassword={(values) => mockChangePassword(values, 'success')}
        />
      ) : null}
    </TemplateShell>
  )
}
