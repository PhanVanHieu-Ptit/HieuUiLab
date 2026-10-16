import type { ActivityEntry } from '@/components/blocks/activity-list'
import type { DashboardPeriod } from '@/components/blocks/dashboard-overview'

import { series } from '../mock-series'

/**
 * Example data for the Dashboard overview demos: an invented "workspace usage" scenario held in
 * memory. Every figure is made up and the series are calculated, not measured. Nothing is fetched,
 * and the clock is never read: the window ends at `asOf`.
 */
export const asOf = '2026-10-12T18:00:00Z'

const dayLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

/** Labels for `length` days ending on the day of `asOf`. */
function dayLabels(length: number): string[] {
  const end = Date.parse(asOf)
  return Array.from({ length }, (_, index) =>
    dayLabel.format(new Date(end - (length - 1 - index) * 86_400_000)),
  )
}

function trendPoints(values: readonly number[]) {
  const labels = dayLabels(values.length)
  return values.map((value, index) => ({ label: labels[index] ?? '', value }))
}

function summary(name: string, range: string, values: readonly number[]): string {
  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  const direction = last >= first ? 'up' : 'down'
  return `${name}, ${range}: ${direction} from ${first.toLocaleString('en-US')} to ${last.toLocaleString('en-US')}`
}

const members7 = [132, 135, 139, 141, 143, 146, 148]
const projects7 = [2, 4, 3, 5, 4, 3, 2]
const tasks7 = series(7, 150, 6, 14)
const response7 = [5.1, 4.9, 4.8, 4.6, 4.5, 4.3, 4.2]

const members30 = series(30, 118, 1, 2)
const projects30 = series(30, 3, 0.05, 1.5).map((value) => Math.max(value, 0))
const tasks30 = series(30, 120, 3.6, 18)
const response30 = series(30, 62, -0.6, 1.2).map((value) => value / 10)

export const periods: Readonly<Record<string, DashboardPeriod>> = {
  '7d': {
    metrics: [
      {
        id: 'members',
        label: 'Active members',
        value: '148',
        change: {
          value: '6.1%',
          direction: 'up',
          sentiment: 'positive',
          period: 'the previous 7 days',
        },
        trend: members7,
        trendLabel: summary('Active members', 'last 7 days', members7),
      },
      {
        id: 'projects',
        label: 'Projects created',
        value: '23',
        change: {
          value: '4',
          direction: 'up',
          sentiment: 'positive',
          period: 'the previous 7 days',
        },
        trend: projects7,
        trendLabel: 'Projects created per day, last 7 days: between 2 and 5',
      },
      {
        id: 'tasks',
        label: 'Tasks completed',
        value: tasks7.reduce((sum, value) => sum + value, 0).toLocaleString('en-US'),
        change: {
          value: '12.4%',
          direction: 'up',
          sentiment: 'positive',
          period: 'the previous 7 days',
        },
        trend: tasks7,
        trendLabel: summary('Tasks completed per day', 'last 7 days', tasks7),
      },
      {
        id: 'response',
        label: 'Median response time',
        value: '4.2 h',
        change: {
          value: '8%',
          direction: 'down',
          sentiment: 'positive',
          period: 'the previous 7 days',
        },
        trend: response7,
        trendLabel: 'Median response time, last 7 days: down from 5.1 h to 4.2 h',
        tone: 'success',
      },
    ],
    trend: {
      name: 'Tasks completed',
      summary: summary('Tasks completed per day', 'last 7 days', tasks7),
      points: trendPoints(tasks7),
    },
    highlights: [
      {
        id: 'atlas',
        name: 'Atlas redesign',
        figure: '212 tasks',
        status: { label: 'On track', tone: 'success' },
      },
      {
        id: 'billing',
        name: 'Billing cleanup',
        figure: '168 tasks',
        status: { label: 'At risk', tone: 'warning' },
      },
      {
        id: 'mobile',
        name: 'Mobile onboarding',
        figure: '131 tasks',
        status: { label: 'On track', tone: 'success' },
      },
      {
        id: 'search',
        name: 'Search relevance',
        figure: '96 tasks',
        status: { label: 'Blocked', tone: 'danger' },
      },
      {
        id: 'docs',
        name: 'Docs refresh',
        figure: '74 tasks',
        status: { label: 'Planned', tone: 'neutral' },
      },
    ],
  },
  '30d': {
    metrics: [
      {
        id: 'members',
        label: 'Active members',
        value: '151',
        change: {
          value: '9.4%',
          direction: 'up',
          sentiment: 'positive',
          period: 'the previous 30 days',
        },
        trend: members30,
        trendLabel: summary('Active members', 'last 30 days', members30),
      },
      {
        id: 'projects',
        label: 'Projects created',
        value: '88',
        change: {
          value: '11',
          direction: 'up',
          sentiment: 'positive',
          period: 'the previous 30 days',
        },
        trend: projects30,
        trendLabel: 'Projects created per day, last 30 days',
      },
      {
        id: 'tasks',
        label: 'Tasks completed',
        value: tasks30.reduce((sum, value) => sum + value, 0).toLocaleString('en-US'),
        change: {
          value: '3.2%',
          direction: 'down',
          sentiment: 'negative',
          period: 'the previous 30 days',
        },
        trend: tasks30,
        trendLabel: summary('Tasks completed per day', 'last 30 days', tasks30),
      },
      {
        id: 'response',
        label: 'Median response time',
        value: '4.6 h',
        change: {
          value: '0.3 h',
          direction: 'down',
          sentiment: 'positive',
          period: 'the previous 30 days',
        },
        trend: response30,
        trendLabel: summary('Median response time (hours)', 'last 30 days', response30),
        tone: 'success',
      },
    ],
    trend: {
      name: 'Tasks completed',
      summary: summary('Tasks completed per day', 'last 30 days', tasks30),
      points: trendPoints(tasks30),
    },
    highlights: [
      {
        id: 'atlas',
        name: 'Atlas redesign',
        figure: '902 tasks',
        status: { label: 'On track', tone: 'success' },
      },
      {
        id: 'mobile',
        name: 'Mobile onboarding',
        figure: '655 tasks',
        status: { label: 'On track', tone: 'success' },
      },
      {
        id: 'billing',
        name: 'Billing cleanup',
        figure: '611 tasks',
        status: { label: 'At risk', tone: 'warning' },
      },
    ],
  },
}

export const activity: readonly ActivityEntry[] = [
  {
    id: 'act-1',
    actor: 'Lan Anh',
    action: 'completed',
    target: '“Draft launch email”',
    timestamp: '2026-10-12T17:12:00Z',
  },
  {
    id: 'act-2',
    actor: 'Bruno Alves',
    action: 'created project',
    target: 'Docs refresh',
    timestamp: '2026-10-12T15:40:00Z',
  },
  {
    id: 'act-3',
    actor: 'Amara Okafor',
    action: 'commented on',
    target: '“Search relevance”',
    timestamp: '2026-10-12T13:05:00Z',
  },
  {
    id: 'act-4',
    actor: 'Minh Tran',
    action: 'marked as blocked',
    target: '“Index rebuild”',
    timestamp: '2026-10-11T22:30:00Z',
  },
  {
    id: 'act-5',
    actor: 'Sofia Rossi',
    action: 'invited 3 members to',
    target: 'Atlas redesign',
    timestamp: '2026-10-11T09:15:00Z',
  },
]
