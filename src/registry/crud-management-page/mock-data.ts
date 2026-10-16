import type { ManagedMember } from '@/components/blocks/crud-management-page'

/**
 * Example data for the CRUD management page demos. The twelve people are invented and held in
 * memory: names are made up, emails use example.com, and nothing is stored or sent. The clock is
 * never read: new members get `joinedAt` from a fixed date.
 */
export const joinedAtForNewMembers = '2026-10-12T18:00:00Z'

export const initialMembers: readonly ManagedMember[] = [
  {
    id: 'mem-1',
    name: 'Lan Anh Pham',
    email: 'lananh@example.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2025-11-03T09:00:00Z',
  },
  {
    id: 'mem-2',
    name: 'Bruno Alves',
    email: 'bruno@example.com',
    role: 'editor',
    status: 'active',
    joinedAt: '2025-12-14T09:00:00Z',
  },
  {
    id: 'mem-3',
    name: 'Amara Okafor',
    email: 'amara@example.com',
    role: 'editor',
    status: 'active',
    joinedAt: '2026-01-20T09:00:00Z',
  },
  {
    id: 'mem-4',
    name: 'Minh Trần',
    email: 'minh.tran@example.com',
    role: 'viewer',
    status: 'invited',
    joinedAt: '2026-09-28T09:00:00Z',
  },
  {
    id: 'mem-5',
    name: 'Sofia Rossi',
    email: 'sofia@example.com',
    role: 'viewer',
    status: 'active',
    joinedAt: '2026-02-09T09:00:00Z',
  },
  {
    id: 'mem-6',
    name: 'Dũng Nguyễn',
    email: 'dung@example.com',
    role: 'editor',
    status: 'suspended',
    joinedAt: '2026-03-02T09:00:00Z',
  },
  {
    id: 'mem-7',
    name: 'Hana Suzuki',
    email: 'hana@example.com',
    role: 'viewer',
    status: 'active',
    joinedAt: '2026-04-17T09:00:00Z',
  },
  {
    id: 'mem-8',
    name: 'Omar Haddad',
    email: 'omar@example.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-05-05T09:00:00Z',
  },
  {
    id: 'mem-9',
    name: 'Priya Raman',
    email: 'priya@example.com',
    role: 'viewer',
    status: 'invited',
    joinedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'mem-10',
    name: 'Tomás Herrera',
    email: 'tomas@example.com',
    role: 'editor',
    status: 'active',
    joinedAt: '2026-06-23T09:00:00Z',
  },
  {
    id: 'mem-11',
    name: 'Ingrid Larsen',
    email: 'ingrid@example.com',
    role: 'viewer',
    status: 'active',
    joinedAt: '2026-07-11T09:00:00Z',
  },
  {
    id: 'mem-12',
    name: 'Kofi Mensah',
    email: 'kofi@example.com',
    role: 'viewer',
    status: 'suspended',
    joinedAt: '2026-08-30T09:00:00Z',
  },
]

/** The next id after the largest `mem-<n>` in the list; deterministic, unlike a random id. */
export function nextMemberId(members: readonly ManagedMember[]): string {
  const highest = members.reduce((max, member) => {
    const value = Number(member.id.replace('mem-', ''))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)
  return `mem-${String(highest + 1)}`
}

/** Whether another member already uses this email, ignoring case and the member being edited. */
export function emailTaken(
  members: readonly ManagedMember[],
  email: string,
  exceptId?: string,
): boolean {
  const wanted = email.trim().toLowerCase()
  return members.some((member) => member.id !== exceptId && member.email.toLowerCase() === wanted)
}

export type CrudOutcome = 'success' | 'rejected' | 'unavailable'

export const crudOutcomes: readonly { value: CrudOutcome; label: string }[] = [
  { value: 'success', label: 'Works' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'unavailable', label: 'Service unavailable' },
]
