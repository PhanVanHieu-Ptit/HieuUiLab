import type { Incident, MonitoredService } from '@/components/blocks/monitoring-dashboard'

import { series } from '../mock-series'

/**
 * Example data for the Monitoring dashboard demos. The services, incidents, and every reading are
 * invented and held in memory; no system is being monitored. The series are calculated, not
 * measured, and the clock is never read: "now" is `checkedAt`.
 */
export const checkedAt = '2026-10-12T18:00:00Z'

/** The time of the nth refresh in a demo, one minute after the one before. */
export function checkedAtAfter(refreshes: number): string {
  return new Date(Date.parse(checkedAt) + refreshes * 60_000).toISOString()
}

function reading(
  start: number,
  wobble: number,
  uptimePct: number,
  slope = 0,
): MonitoredService['readings'] {
  return {
    '24h': { latencyMs: series(24, start, slope, wobble), uptimePct },
    '7d': { latencyMs: series(14, start, slope / 2, wobble * 1.4), uptimePct: uptimePct + 0.03 },
  }
}

export const services: readonly MonitoredService[] = [
  { id: 'api', name: 'API gateway', status: 'operational', readings: reading(96, 12, 99.98) },
  { id: 'web', name: 'Web app', status: 'operational', readings: reading(140, 18, 99.95) },
  { id: 'auth', name: 'Authentication', status: 'operational', readings: reading(72, 9, 99.99) },
  {
    id: 'search',
    name: 'Search',
    status: 'degraded',
    readings: reading(210, 40, 99.2, 6),
  },
  {
    id: 'jobs',
    name: 'Background jobs',
    status: 'outage',
    readings: reading(320, 60, 94.8, 14),
  },
  {
    id: 'reports',
    name: 'Reports',
    status: 'maintenance',
    readings: reading(180, 20, 99.7),
  },
]

export const incidents: readonly Incident[] = [
  {
    id: 'inc-4',
    title: 'Background jobs are not processing',
    serviceId: 'jobs',
    severity: 'critical',
    status: 'investigating',
    startedAt: '2026-10-12T16:20:00Z',
  },
  {
    id: 'inc-3',
    title: 'Slow search results',
    serviceId: 'search',
    severity: 'major',
    status: 'monitoring',
    startedAt: '2026-10-12T11:05:00Z',
  },
  {
    id: 'inc-2',
    title: 'Login errors for some users',
    serviceId: 'auth',
    severity: 'major',
    status: 'resolved',
    startedAt: '2026-10-11T08:12:00Z',
    resolvedAt: '2026-10-11T10:47:00Z',
  },
  {
    id: 'inc-1',
    title: 'Delayed report exports',
    serviceId: 'reports',
    severity: 'minor',
    status: 'resolved',
    startedAt: '2026-10-09T13:00:00Z',
    resolvedAt: '2026-10-09T14:30:00Z',
  },
]

/** The same services with everything healthy, for the quiet state. */
export const healthyServices: readonly MonitoredService[] = services.map((service) => ({
  ...service,
  status: 'operational',
}))
