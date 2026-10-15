import type { StatusTone } from '@/components/ui/status-badge'

export interface Deployment {
  id: string
  service: string
  environment: 'production' | 'staging'
  status: 'live' | 'building' | 'failed'
  durationSeconds: number | null
}

/** One tone per status, in one place; the generated code prints this same table. */
export const statusTone = {
  live: 'success',
  building: 'info',
  failed: 'danger',
} as const satisfies Record<Deployment['status'], StatusTone>

export const maxDeployments = 40

/** The text of the error state; the generated code uses the same message. */
export const errorMessage = 'The deployments service did not respond.'

const services = [
  'checkout-api',
  'search-worker',
  'web',
  'auth-service',
  'billing-api',
  'image-resizer',
  'notifications',
  'admin',
] as const
const environments = ['production', 'staging'] as const
const statuses = ['live', 'live', 'failed', 'live', 'building', 'live', 'live'] as const

function cycle<T>(list: readonly [T, ...T[]], index: number): T {
  return list[index % list.length] ?? list[0]
}

/** `count` sample rows. The same count always gives the same rows. */
export function makeDeployments(count: number): Deployment[] {
  const size = Math.min(Math.max(Math.floor(count) || 0, 0), maxDeployments)
  return Array.from({ length: size }, (_, index) => {
    const status = cycle(statuses, index)
    return {
      id: `d${String(index + 1)}`,
      service: cycle(services, index),
      environment: cycle(environments, index + Math.floor(index / services.length)),
      status,
      durationSeconds: status === 'building' ? null : 20 + ((index * 37) % 220),
    }
  })
}

export function formatDuration(seconds: number | null): string {
  return seconds === null ? '—' : `${String(seconds)}s`
}
