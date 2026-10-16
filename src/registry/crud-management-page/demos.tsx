import { useState } from 'react'

import {
  CrudManagementPage,
  type ManagedMember,
  type MemberFormInput,
} from '@/components/blocks/crud-management-page'
import type { SubmitResult } from '@/components/ui/form'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import { mockDelay } from '../mock-delay'
import {
  crudOutcomes,
  emailTaken,
  initialMembers,
  joinedAtForNewMembers,
  nextMemberId,
  type CrudOutcome,
} from './mock-data'

export function CrudManagementPageDemo() {
  const [members, setMembers] = useState<readonly ManagedMember[]>(initialMembers)

  return (
    <CrudManagementPage
      state={{ status: 'ready', items: members }}
      onCreate={async (values) => {
        await mockDelay(400)
        if (emailTaken(members, values.email)) {
          return {
            ok: false,
            message: 'That email is already on the team.',
            fieldErrors: [
              { name: 'email', message: 'Someone with this email is already a member.' },
            ],
          }
        }
        setMembers((current) => [
          ...current,
          {
            id: nextMemberId(current),
            name: values.name,
            email: values.email,
            role: values.role,
            status: 'invited',
            joinedAt: joinedAtForNewMembers,
          },
        ])
        return { ok: true }
      }}
      onUpdate={async (id, values) => {
        await mockDelay(400)
        if (emailTaken(members, values.email, id)) {
          return {
            ok: false,
            message: 'That email is already on the team.',
            fieldErrors: [
              { name: 'email', message: 'Someone with this email is already a member.' },
            ],
          }
        }
        setMembers((current) =>
          current.map((member) => (member.id === id ? { ...member, ...values } : member)),
        )
        return { ok: true }
      }}
      onDelete={async (member) => {
        await mockDelay(400)
        setMembers((current) => current.filter((candidate) => candidate.id !== member.id))
      }}
    />
  )
}

/** Example only: answers like a server would, according to the picked outcome. */
async function answer(outcome: CrudOutcome): Promise<SubmitResult<MemberFormInput>> {
  await mockDelay(400)
  if (outcome === 'unavailable') throw new Error('Mock: the members service is unavailable.')
  if (outcome === 'rejected') {
    return {
      ok: false,
      message: 'Some details need your attention.',
      fieldErrors: [{ name: 'email', message: 'This email domain is not allowed.' }],
    }
  }
  return { ok: true }
}

export function CrudManagementPageFailuresDemo() {
  const [outcome, setOutcome] = useState<CrudOutcome>('rejected')

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>
        Nothing is saved: the table never changes. Pick what the mock service answers, then try Add
        member, Edit, and Delete.
      </ExampleOnlyNotice>
      <MockPicker options={crudOutcomes} value={outcome} onChange={setOutcome} />
      <CrudManagementPage
        pageSize={4}
        state={{ status: 'ready', items: initialMembers }}
        onCreate={() => answer(outcome)}
        onUpdate={() => answer(outcome)}
        onDelete={async () => {
          await mockDelay(400)
          if (outcome !== 'success') {
            throw new Error('Mock: this member owns a project and can’t be deleted.')
          }
        }}
      />
    </div>
  )
}

type MockState = 'ready' | 'empty' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'With members' },
  { value: 'empty', label: 'No members' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

export function CrudManagementPageStatesDemo() {
  const [mock, setMock] = useState<MockState>('empty')

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>The people are invented and held in memory.</ExampleOnlyNotice>
      <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
      <CrudManagementPage
        state={
          mock === 'loading'
            ? { status: 'loading' }
            : mock === 'error'
              ? { status: 'error', message: 'Mock: the members service did not respond.' }
              : { status: 'ready', items: mock === 'empty' ? [] : initialMembers }
        }
        onRetry={() => {
          setMock('ready')
        }}
        onCreate={() => answer('success')}
        onUpdate={() => answer('success')}
        onDelete={() => mockDelay(400)}
      />
    </div>
  )
}
