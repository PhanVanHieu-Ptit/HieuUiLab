import { useState } from 'react'

import { DataToolbar } from '@/components/blocks/data-toolbar'
import { Button } from '@/components/ui/button'

interface Member {
  id: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
}

// Example data, held in memory.
const members: readonly Member[] = [
  { id: 'm1', name: 'Mai Tran', role: 'owner' },
  { id: 'm2', name: 'Diego Ruiz', role: 'editor' },
  { id: 'm3', name: 'Zoë Müller', role: 'editor' },
  { id: 'm4', name: 'Amara Okafor', role: 'viewer' },
  { id: 'm5', name: 'Noah Kim', role: 'viewer' },
]

const roleLabels = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' }

export function DataToolbarDemo() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')

  const needle = query.trim().toLowerCase()
  const visible = members.filter(
    (member) =>
      (role === 'all' || member.role === role) && member.name.toLowerCase().includes(needle),
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <DataToolbar
        search={{ label: 'Search members', placeholder: 'Name', value: query, onChange: setQuery }}
        filters={[
          {
            id: 'role',
            label: 'Role',
            value: role,
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All roles' },
              { value: 'owner', label: 'Owner' },
              { value: 'editor', label: 'Editor' },
              { value: 'viewer', label: 'Viewer' },
            ],
            onChange: setRole,
          },
        ]}
        resultCount={visible.length}
        formatResultCount={(n) => `${String(n)} ${n === 1 ? 'member' : 'members'}`}
        onReset={() => {
          setQuery('')
          setRole('all')
        }}
        actions={<Button size="sm">Invite member</Button>}
      />
      <ul aria-label="Members" className="divide-y rounded-lg border bg-surface">
        {visible.map((member) => (
          <li key={member.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>{member.name}</span>
            <span className="text-muted-foreground">{roleLabels[member.role]}</span>
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">No members match.</li>
        ) : null}
      </ul>
    </div>
  )
}
