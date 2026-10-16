import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { SubmitResult } from '@/components/ui/form'

import {
  CrudManagementPage,
  filterMembers,
  memberSchema,
  type CrudManagementPageProps,
  type ManagedMember,
  type MemberFormInput,
  type MemberFormValues,
} from './crud-management-page'

type User = ReturnType<typeof userEvent.setup>

function member(overrides: Partial<ManagedMember> & Pick<ManagedMember, 'id' | 'name'>) {
  return {
    email: `${overrides.id}@example.com`,
    role: 'viewer',
    status: 'active',
    joinedAt: '2026-01-15T09:00:00Z',
    ...overrides,
  } satisfies ManagedMember
}

const lan = member({ id: 'lan', name: 'Lan Anh', email: 'lananh@example.com', role: 'admin' })
const bruno = member({ id: 'bruno', name: 'Bruno Alves', role: 'editor' })
const dung = member({
  id: 'dung',
  name: 'Dũng Nguyễn',
  email: 'dung@example.com',
  status: 'suspended',
})
const amara = member({ id: 'amara', name: 'Amara Okafor', status: 'invited' })
const sofia = member({ id: 'sofia', name: 'Sofia Rossi' })
const omar = member({ id: 'omar', name: 'Omar Haddad', role: 'admin' })
const priya = member({ id: 'priya', name: 'Priya Raman' })
const members = [lan, bruno, dung, amara, sofia, omar, priya]

interface Handlers {
  onCreate: (values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>
  onUpdate: (id: string, values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>
  onDelete: (item: ManagedMember) => void | Promise<void>
}

/** Keeps the members in state the way a consumer would. */
function Harness({
  initial = members,
  handlers = {},
  ...props
}: Partial<Omit<CrudManagementPageProps, 'state' | 'onCreate' | 'onUpdate' | 'onDelete'>> & {
  initial?: readonly ManagedMember[]
  handlers?: Partial<Handlers>
}) {
  const [items, setItems] = useState(initial)
  return (
    <CrudManagementPage
      state={{ status: 'ready', items }}
      onCreate={
        handlers.onCreate ??
        ((values) => {
          setItems((current) => [
            ...current,
            member({ id: `new-${String(current.length)}`, ...values, role: values.role }),
          ])
          return Promise.resolve({ ok: true })
        })
      }
      onUpdate={
        handlers.onUpdate ??
        ((id, values) => {
          setItems((current) =>
            current.map((item) => (item.id === id ? { ...item, ...values } : item)),
          )
          return Promise.resolve({ ok: true })
        })
      }
      onDelete={
        handlers.onDelete ??
        ((target) => {
          setItems((current) => current.filter((item) => item.id !== target.id))
        })
      }
      {...props}
    />
  )
}

function names() {
  return within(screen.getByRole('table', { name: 'Team members' }))
    .getAllByRole('rowheader')
    .map((header) => header.querySelector('span')?.textContent)
}

async function choose(user: User, name: string, option: string) {
  screen.getByRole('combobox', { name }).focus()
  await user.keyboard('{Enter}')
  await user.click(await screen.findByRole('option', { name: option }))
}

async function openAdd(user: User) {
  await user.click(screen.getByRole('button', { name: 'Add member' }))
  return screen.findByRole('dialog', { name: 'Add member' })
}

/** A promise the test settles by hand, to observe the pending state. */
function deferred<T>() {
  let settle: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle?.(value) }
}

describe('memberSchema', () => {
  const valid: MemberFormInput = { name: ' Lan Anh ', email: ' lan@example.com ', role: 'admin' }

  it('trims text and keeps a typed role', () => {
    expect(memberSchema.parse(valid)).toEqual({
      name: 'Lan Anh',
      email: 'lan@example.com',
      role: 'admin',
    })
  })

  it.each<[string, Partial<MemberFormInput>, string]>([
    ['a short name', { name: 'L' }, 'name: Enter a name (at least 2 characters).'],
    ['an empty email', { email: ' ' }, 'email: Enter an email address.'],
    [
      'a malformed email',
      { email: 'lan@' },
      'email: Enter an email address like name@example.com.',
    ],
    ['no role', { role: '' }, 'role: Choose a role.'],
    ['an unknown role', { role: 'owner' }, 'role: Choose a role.'],
  ])('rejects %s', (_case, input, message) => {
    const result = memberSchema.safeParse({ ...valid, ...input })
    expect(
      result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    ).toEqual([message])
  })
})

describe('filterMembers', () => {
  const all = { query: '', role: 'all', status: 'all' } as const

  it('keeps everything when nothing is set', () => {
    expect(filterMembers(members, all)).toHaveLength(7)
  })

  it('matches the name or the email, ignoring case and accents', () => {
    expect(filterMembers(members, { ...all, query: 'NGUYEN' }).map((item) => item.id)).toEqual([
      'dung',
    ])
    expect(filterMembers(members, { ...all, query: 'dung@' }).map((item) => item.id)).toEqual([
      'dung',
    ])
    expect(filterMembers(members, { ...all, query: ' lan ' }).map((item) => item.id)).toEqual([
      'lan',
    ])
  })

  it('needs every filter to match', () => {
    expect(
      filterMembers(members, { query: '', role: 'admin', status: 'active' }).map((item) => item.id),
    ).toEqual(['lan', 'omar'])
    expect(filterMembers(members, { query: 'lan', role: 'editor', status: 'all' })).toEqual([])
  })
})

describe('CrudManagementPage', () => {
  describe('the table', () => {
    it('lists the first page sorted by name, with a count', () => {
      render(<Harness />)

      expect(screen.getByRole('heading', { level: 2, name: 'Team members' })).toBeInTheDocument()
      expect(names()).toEqual([
        'Amara Okafor',
        'Bruno Alves',
        'Dũng Nguyễn',
        'Lan Anh',
        'Omar Haddad',
      ])
      expect(screen.getByText('7 members')).toBeInTheDocument()
    })

    it('uses a custom title, description, and page size', () => {
      render(<Harness title="People" description="Who is here." pageSize={3} />)

      expect(screen.getByRole('heading', { level: 2, name: 'People' })).toBeInTheDocument()
      expect(screen.getByText('Who is here.')).toBeInTheDocument()
      expect(
        within(screen.getByRole('table', { name: 'People' })).getAllByRole('rowheader'),
      ).toHaveLength(3)
    })

    it('shows status in words and the role under the name', () => {
      render(<Harness />)

      const row = screen.getByRole('rowheader', { name: /Dũng Nguyễn/ }).closest('tr')
      expect(row).toHaveTextContent('Suspended')
      expect(row).toHaveTextContent('dung@example.com')
    })

    it('moves to the next page', async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.click(screen.getByRole('button', { name: 'Next page' }))

      expect(names()).toEqual(['Priya Raman', 'Sofia Rossi'])
    })
  })

  describe('search and filters', () => {
    it('finds people regardless of accents and case', async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.type(screen.getByRole('searchbox', { name: 'Search members' }), 'NGUYEN')

      expect(names()).toEqual(['Dũng Nguyễn'])
      expect(screen.getByText('1 member')).toBeInTheDocument()
    })

    it('filters by role and by status', async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await choose(user, 'Role', 'Admin')
      expect(names()).toEqual(['Lan Anh', 'Omar Haddad'])

      await choose(user, 'Status', 'Invited')
      expect(screen.getByRole('heading', { name: 'No members match' })).toBeInTheDocument()
    })

    it('goes back to the first page when a filter changes', async () => {
      const user = userEvent.setup()
      render(<Harness />)
      await user.click(screen.getByRole('button', { name: 'Next page' }))
      expect(names()).toEqual(['Priya Raman', 'Sofia Rossi'])

      await choose(user, 'Role', 'Viewer')

      expect(names()).toEqual(['Amara Okafor', 'Dũng Nguyễn', 'Priya Raman', 'Sofia Rossi'])
      expect(screen.queryByRole('button', { name: 'Page 2' })).toBeNull()
    })

    it('clears the search and the filters together', async () => {
      const user = userEvent.setup()
      render(<Harness />)
      await user.type(screen.getByRole('searchbox', { name: 'Search members' }), 'a')
      await choose(user, 'Role', 'Admin')

      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(screen.getByRole('searchbox', { name: 'Search members' })).toHaveValue('')
      expect(screen.getByText('7 members')).toBeInTheDocument()
    })
  })

  describe('empty, loading, and error', () => {
    it('invites the first member when there are none, and opens the form from there', async () => {
      const user = userEvent.setup()
      render(<Harness initial={[]} />)

      expect(screen.getByRole('heading', { name: 'No members yet' })).toBeInTheDocument()
      const addButtons = screen.getAllByRole('button', { name: 'Add member' })
      expect(addButtons).toHaveLength(2)

      await user.click(addButtons[1] ?? addButtons[0] ?? document.body)
      expect(await screen.findByRole('dialog', { name: 'Add member' })).toBeInTheDocument()
    })

    it('offers to clear the filters when they hide everything', async () => {
      const user = userEvent.setup()
      render(<Harness />)
      await user.type(screen.getByRole('searchbox', { name: 'Search members' }), 'zzz')

      expect(screen.getByRole('heading', { name: 'No members match' })).toBeInTheDocument()
      const clear = screen.getAllByRole('button', { name: 'Clear filters' })
      await user.click(clear[clear.length - 1] ?? document.body)

      expect(screen.getByText('7 members')).toBeInTheDocument()
    })

    it('announces loading', () => {
      render(
        <CrudManagementPage
          state={{ status: 'loading' }}
          onCreate={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />,
      )

      expect(screen.getByText('Loading members…')).toBeInTheDocument()
    })

    it('shows the error as an alert and retries', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(
        <CrudManagementPage
          state={{ status: 'error', message: 'Mock: the members service did not respond.' }}
          onRetry={onRetry}
          onCreate={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />,
      )

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Mock: the members service did not respond.',
      )
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })
  })

  describe('adding a member', () => {
    it('blocks an empty form, describes each error, and focuses the first', async () => {
      const user = userEvent.setup()
      const onCreate = vi.fn()
      render(<Harness handlers={{ onCreate }} />)
      const dialog = await openAdd(user)

      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

      const name = within(dialog).getByRole('textbox', { name: 'Name' })
      expect(name).toHaveFocus()
      expect(name).toBeInvalid()
      expect(name).toHaveAccessibleDescription('Enter a name (at least 2 characters).')
      expect(within(dialog).getByRole('textbox', { name: 'Email' })).toBeInvalid()
      expect(onCreate).not.toHaveBeenCalled()
    })

    it('starts with the least access', async () => {
      const user = userEvent.setup()
      render(<Harness />)
      const dialog = await openAdd(user)

      expect(within(dialog).getByRole('combobox', { name: 'Role' })).toHaveTextContent('Viewer')
    })

    it('creates the member, closes the dialog, and announces it', async () => {
      const user = userEvent.setup()
      const onCreate = vi.fn<Handlers['onCreate']>(() => Promise.resolve({ ok: true }))
      render(<Harness handlers={{ onCreate }} />)
      const dialog = await openAdd(user)

      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), '  Zed Zimmer ')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'zed@example.com')
      await choose(user, 'Role', 'Editor')
      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

      expect(onCreate).toHaveBeenCalledExactlyOnceWith({
        name: 'Zed Zimmer',
        email: 'zed@example.com',
        role: 'editor',
      })
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
      expect(screen.getByText('Added Zed Zimmer.')).toBeInTheDocument()
    })

    it('adds the row when the consumer updates its state', async () => {
      const user = userEvent.setup()
      render(<Harness pageSize={10} />)
      const dialog = await openAdd(user)

      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Zed Zimmer')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'zed@example.com')
      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

      await waitFor(() => {
        expect(names()).toContain('Zed Zimmer')
      })
      expect(screen.getByText('8 members')).toBeInTheDocument()
    })

    it('disables the form while saving', async () => {
      const user = userEvent.setup()
      const save = deferred<SubmitResult<MemberFormInput>>()
      render(<Harness handlers={{ onCreate: () => save.promise }} />)
      const dialog = await openAdd(user)
      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Zed Zimmer')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'zed@example.com')

      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

      const button = within(dialog).getByRole('button', { name: 'Saving…' })
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(within(dialog).getByRole('textbox', { name: 'Name' })).toBeDisabled()
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()

      save.resolve({ ok: true })
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })

    it('keeps the dialog open and shows a server error on its field', async () => {
      const user = userEvent.setup()
      render(
        <Harness
          handlers={{
            onCreate: () =>
              Promise.resolve({
                ok: false,
                message: 'That email is already on the team.',
                fieldErrors: [{ name: 'email', message: 'Someone with this email is a member.' }],
              }),
          }}
        />,
      )
      const dialog = await openAdd(user)
      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Zed Zimmer')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'lan@example.com')

      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

      const email = within(dialog).getByRole('textbox', { name: 'Email' })
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Not saved')
      expect(email).toBeInvalid()
      expect(email).toHaveAccessibleDescription('Someone with this email is a member.')
      await waitFor(() => {
        expect(email).toHaveFocus()
      })
      expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Zed Zimmer')
    })

    it('shows a generic message and keeps the values when saving fails', async () => {
      const user = userEvent.setup()
      render(<Harness handlers={{ onCreate: () => Promise.reject(new Error('Mock: down')) }} />)
      const dialog = await openAdd(user)
      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Zed Zimmer')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'zed@example.com')

      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))

      const alert = await within(dialog).findByRole('alert')
      expect(alert).toHaveTextContent('Something went wrong, and nothing was saved. Try again.')
      expect(within(dialog).getByRole('textbox', { name: 'Email' })).toHaveValue('zed@example.com')
    })

    it('closes without saving on Cancel and starts empty next time', async () => {
      const user = userEvent.setup()
      const onCreate = vi.fn()
      render(<Harness handlers={{ onCreate }} />)
      const dialog = await openAdd(user)
      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Zed')

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
      const reopened = await openAdd(user)

      expect(onCreate).not.toHaveBeenCalled()
      expect(within(reopened).getByRole('textbox', { name: 'Name' })).toHaveValue('')
    })
  })

  describe('editing a member', () => {
    it('opens with the member’s details', async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.click(screen.getByRole('button', { name: 'Edit Bruno Alves' }))

      const dialog = await screen.findByRole('dialog', { name: 'Edit member' })
      expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Bruno Alves')
      expect(within(dialog).getByRole('textbox', { name: 'Email' })).toHaveValue(
        'bruno@example.com',
      )
      expect(within(dialog).getByRole('combobox', { name: 'Role' })).toHaveTextContent('Editor')
    })

    it('saves through onUpdate with the member’s id and updates the row', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn<Handlers['onUpdate']>(() => Promise.resolve({ ok: true }))
      render(<Harness handlers={{ onUpdate }} />)
      await user.click(screen.getByRole('button', { name: 'Edit Bruno Alves' }))
      const dialog = await screen.findByRole('dialog', { name: 'Edit member' })

      await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }))
      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Bruno A.')
      await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

      expect(onUpdate).toHaveBeenCalledExactlyOnceWith('bruno', {
        name: 'Bruno A.',
        email: 'bruno@example.com',
        role: 'editor',
      })
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
      expect(screen.getByText('Updated Bruno A..')).toBeInTheDocument()
    })
  })

  describe('deleting a member', () => {
    it('asks first and deletes only after the user confirms', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(<Harness handlers={{ onDelete }} />)

      await user.click(screen.getByRole('button', { name: 'Delete Bruno Alves' }))
      const dialog = await screen.findByRole('dialog', { name: 'Delete this member?' })
      expect(dialog).toHaveTextContent('Bruno Alves (bruno@example.com) will lose access.')
      expect(onDelete).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole('button', { name: 'Delete member' }))

      expect(onDelete).toHaveBeenCalledExactlyOnceWith(bruno)
    })

    it('removes the row, announces it, and keeps focus on the page heading', async () => {
      const user = userEvent.setup()
      render(<Harness />)

      await user.click(screen.getByRole('button', { name: 'Delete Bruno Alves' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete member' }),
      )

      await waitFor(() => {
        expect(names()).not.toContain('Bruno Alves')
      })
      expect(screen.getByText('Deleted Bruno Alves.')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Team members' })).toHaveFocus()
    })

    it('does nothing when the user cancels', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(<Harness handlers={{ onDelete }} />)

      await user.click(screen.getByRole('button', { name: 'Delete Bruno Alves' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
      )

      expect(onDelete).not.toHaveBeenCalled()
      expect(names()).toContain('Bruno Alves')
    })

    it('shows a failure inside the confirmation and keeps the row', async () => {
      const user = userEvent.setup()
      render(
        <Harness
          handlers={{ onDelete: () => Promise.reject(new Error('This member owns a project.')) }}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Delete Bruno Alves' }))
      const dialog = await screen.findByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: 'Delete member' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'This member owns a project.',
      )

      // While the dialog is open the page behind it is hidden from assistive technology.
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
      expect(names()).toContain('Bruno Alves')
    })
  })
})
