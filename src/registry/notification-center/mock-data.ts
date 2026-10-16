import type { NotificationEntry } from '@/components/blocks/notification-center'

/**
 * Example data for the Notification center demos. Everything here is invented and held in
 * memory: names, tasks, and messages describe no real workspace, and nothing is fetched.
 * Relative times are measured from `asOf`, so the demo output is the same on every visit.
 */
export const asOf = '2026-10-12T18:00:00Z'

export const notifications: readonly NotificationEntry[] = [
  {
    id: 'ntf-1',
    type: 'mention',
    title: 'Lan Anh mentioned you in “Q4 launch checklist”',
    description: 'Can you confirm the rollout window before Friday?',
    timestamp: '2026-10-12T17:42:00Z',
    read: false,
  },
  {
    id: 'ntf-2',
    type: 'assignment',
    title: 'Bruno Alves assigned you “Review onboarding copy”',
    description: 'Due Thursday. Three short screens, no code changes.',
    timestamp: '2026-10-12T16:05:00Z',
    read: false,
  },
  {
    id: 'ntf-3',
    type: 'security',
    title: 'New sign-in from Chrome on macOS',
    description: 'Hà Nội, Vietnam. If this was not you, change your password.',
    timestamp: '2026-10-12T14:30:00Z',
    read: false,
  },
  {
    id: 'ntf-4',
    type: 'system',
    title: 'Scheduled maintenance on Oct 14',
    description: 'The reports service will be read-only from 02:00 to 02:30 UTC.',
    timestamp: '2026-10-12T09:00:00Z',
    read: true,
  },
  {
    id: 'ntf-5',
    type: 'mention',
    title: 'Amara Okafor replied to your comment',
    description: '“Agreed, let’s keep the table dense on mobile.”',
    timestamp: '2026-10-11T20:15:00Z',
    read: false,
  },
  {
    id: 'ntf-6',
    type: 'assignment',
    title: 'Task “Update API docs” is due tomorrow',
    timestamp: '2026-10-11T08:00:00Z',
    read: true,
  },
  {
    id: 'ntf-7',
    type: 'system',
    title: 'Your member export is ready',
    description: 'members-export.csv is an example file and does not exist.',
    timestamp: '2026-10-09T13:20:00Z',
    read: true,
  },
  {
    id: 'ntf-8',
    type: 'security',
    title: 'Password changed',
    description: 'You changed your password from a recognised device.',
    timestamp: '2026-10-07T10:00:00Z',
    read: true,
  },
]
