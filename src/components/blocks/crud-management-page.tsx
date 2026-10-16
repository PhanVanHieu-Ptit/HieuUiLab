import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ConfirmAction } from '@/components/blocks/confirm-action'
import {
  DataTable,
  type DataTableColumn,
  type DataTableState,
} from '@/components/blocks/data-table'
import { DataToolbar } from '@/components/blocks/data-toolbar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldControl } from '@/components/ui/field'
import { FormField, useFormSubmit, type SubmitResult } from '@/components/ui/form'
import { FormFeedback } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { cn } from '@/lib/cn'

const memberRoles = ['admin', 'editor', 'viewer'] as const
export type MemberRole = (typeof memberRoles)[number]

const memberStatuses = ['active', 'invited', 'suspended'] as const
export type MemberStatus = (typeof memberStatuses)[number]

/** The record this page manages. Swap it for your own entity: see the guidelines. */
export interface ManagedMember {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  /** ISO 8601 timestamp. */
  joinedAt: string
}

/** Every rule the member form enforces. The UI only displays this schema's results. */
export const memberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter a name (at least 2 characters).')
    .max(60, 'Use 60 characters or fewer.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address.')
    .pipe(z.email('Enter an email address like name@example.com.')),
  // A string first, so an unchosen role reports the message below.
  role: z.string().pipe(z.enum(memberRoles, 'Choose a role.')),
})

/** What the form inputs hold while editing. */
export type MemberFormInput = z.input<typeof memberSchema>
/** What a valid submission delivers: trimmed text and a typed role. */
export type MemberFormValues = z.output<typeof memberSchema>

export interface MemberFilters {
  query: string
  role: MemberRole | 'all'
  status: MemberStatus | 'all'
}

export interface CrudManagementPageProps {
  /** Loading and error come from the table; `ready` with no items is the “no members yet” state. */
  state: DataTableState<ManagedMember>
  /** Creates a member. Return field errors the server found, such as a taken email. */
  onCreate: (values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>
  /** Updates the member with this id. Same contract as onCreate. */
  onUpdate: (id: string, values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>
  /** Deletes a member after the user confirms. A rejection is shown inside the confirmation. */
  onDelete: (member: ManagedMember) => void | Promise<void>
  /** Shows a retry button in the error state. */
  onRetry?: () => void
  title?: string
  description?: string
  /** Rows per page. */
  pageSize?: number
  /** Portal the add/edit dialog into this element instead of `document.body`. */
  dialogContainer?: HTMLElement | null
  className?: string
}

const roleLabels: Record<MemberRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

const statusLabels: Record<MemberStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
}

const statusTone: Record<MemberStatus, StatusTone> = {
  active: 'success',
  invited: 'info',
  suspended: 'warning',
}

const initialFilters: MemberFilters = { query: '', role: 'all', status: 'all' }

const joinedDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function formatJoined(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : joinedDate.format(date)
}

/** Lowercase without accents, so “nguyen” finds “Nguyễn” and “dung” finds “Dũng”. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase()
}

/** The pure filter the page uses; exported for tests and server reuse. */
export function filterMembers(
  members: readonly ManagedMember[],
  filters: MemberFilters,
): ManagedMember[] {
  const query = fold(filters.query.trim())
  return members.filter(
    (member) =>
      (query === '' || fold(member.name).includes(query) || fold(member.email).includes(query)) &&
      (filters.role === 'all' || member.role === filters.role) &&
      (filters.status === 'all' || member.status === filters.status),
  )
}

type MemberTarget = { mode: 'create' } | { mode: 'edit'; member: ManagedMember }

function MemberForm({
  member,
  onSubmit,
  onDone,
  onCancel,
}: {
  member: ManagedMember | undefined
  onSubmit: (values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const form = useForm<MemberFormInput, unknown, MemberFormValues>({
    resolver: zodResolver(memberSchema),
    // New members start with the least access.
    defaultValues: member
      ? { name: member.name, email: member.email, role: member.role }
      : { name: '', email: '', role: 'viewer' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { control } = form
  const { submit, pending, feedback } = useFormSubmit(
    form,
    async (values) => {
      const result = await onSubmit(values)
      if (result.ok) {
        onDone(result.message ?? (member ? `Updated ${values.name}.` : `Added ${values.name}.`))
      }
      return result
    },
    { failureMessage: 'Something went wrong, and nothing was saved. Try again.' },
  )

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
      <DialogBody>
        <fieldset disabled={pending} className="grid min-w-0 gap-4">
          <FormField
            control={control}
            name="name"
            label="Name"
            required
            render={({ field }) => (
              <FieldControl>
                <Input autoComplete="off" {...field} />
              </FieldControl>
            )}
          />
          <FormField
            control={control}
            name="email"
            label="Email"
            required
            render={({ field }) => (
              <FieldControl>
                <Input type="email" autoComplete="off" spellCheck={false} {...field} />
              </FieldControl>
            )}
          />
          <FormField
            control={control}
            name="role"
            label="Role"
            required
            render={({ field }) => (
              <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                <FieldControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                </FieldControl>
                <SelectContent>
                  {memberRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </fieldset>
        {feedback?.status === 'error' ? (
          <FormFeedback
            key={feedback.id}
            status="error"
            title="Not saved"
            focusOnMount={feedback.focus}
            className="mt-4"
          >
            {feedback.message}
          </FormFeedback>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {pending ? 'Saving…' : member ? 'Save changes' : 'Add member'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * A management page for one kind of record: search, filters, a sortable paged table, and add,
 * edit, and delete (with confirmation). It owns the view state (search, filters, page, which dialog
 * is open) and nothing else: members live in your state or server, and every change goes through
 * the handlers you pass. The example record is a team member; see the guidelines for adapting it.
 */
export function CrudManagementPage({
  state,
  onCreate,
  onUpdate,
  onDelete,
  onRetry,
  title = 'Team members',
  description = 'Invite people, change their role, or remove their access.',
  pageSize = 5,
  dialogContainer,
  className,
}: CrudManagementPageProps) {
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [filters, setFilters] = useState<MemberFilters>(initialFilters)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [target, setTarget] = useState<MemberTarget>({ mode: 'create' })
  const [announcement, setAnnouncement] = useState('')

  const members = useMemo(() => (state.status === 'ready' ? state.items : []), [state])
  const visible = useMemo(() => filterMembers(members, filters), [members, filters])
  const filtered = filters.query.trim() !== '' || filters.role !== 'all' || filters.status !== 'all'

  const changeFilters = (next: MemberFilters) => {
    setFilters(next)
    setPage(1)
  }

  const columns = useMemo<readonly DataTableColumn<ManagedMember>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        rowHeader: true,
        sortValue: (member) => member.name,
        cell: (member) => (
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{member.name}</span>
            <span className="text-xs break-all text-muted-foreground">{member.email}</span>
            <span className="text-xs text-muted-foreground sm:hidden">
              {roleLabels[member.role]}
            </span>
          </div>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        hideBelow: 'sm',
        sortValue: (member) => roleLabels[member.role],
        cell: (member) => roleLabels[member.role],
      },
      {
        id: 'status',
        header: 'Status',
        sortValue: (member) => statusLabels[member.status],
        cell: (member) => (
          <StatusBadge tone={statusTone[member.status]}>{statusLabels[member.status]}</StatusBadge>
        ),
      },
      {
        id: 'joined',
        header: 'Joined',
        hideBelow: 'lg',
        sortValue: (member) => member.joinedAt,
        cell: (member) => formatJoined(member.joinedAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'end',
        cell: (member) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${member.name}`}
              onClick={() => {
                setTarget({ mode: 'edit', member })
                setDialogOpen(true)
              }}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <ConfirmAction
              trigger={
                <Button variant="ghost" size="sm" aria-label={`Delete ${member.name}`}>
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              }
              title="Delete this member?"
              description={`${member.name} (${member.email}) will lose access. This can’t be undone.`}
              confirmLabel="Delete member"
              onConfirm={async () => {
                await onDelete(member)
                setAnnouncement(`Deleted ${member.name}.`)
                // The row, and the button that opened this, are gone: keep focus on the page.
                headingRef.current?.focus()
              }}
            />
          </div>
        ),
      },
    ],
    [onDelete],
  )

  const openCreate = () => {
    setTarget({ mode: 'create' })
    setDialogOpen(true)
  }

  return (
    <section aria-labelledby={headingId} className={cn('@container w-full min-w-0', className)}>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="rounded-sm text-xl font-semibold tracking-tight outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        <DataToolbar
          search={{
            label: 'Search members',
            placeholder: 'Name or email',
            value: filters.query,
            onChange: (query) => {
              changeFilters({ ...filters, query })
            },
          }}
          filters={[
            {
              id: 'role',
              label: 'Role',
              value: filters.role,
              defaultValue: 'all',
              options: [
                { value: 'all', label: 'All roles' },
                ...memberRoles.map((value) => ({ value, label: roleLabels[value] })),
              ],
              onChange: (value) => {
                const role = memberRoles.find((candidate) => candidate === value)
                changeFilters({ ...filters, role: role ?? 'all' })
              },
            },
            {
              id: 'status',
              label: 'Status',
              value: filters.status,
              defaultValue: 'all',
              options: [
                { value: 'all', label: 'All statuses' },
                ...memberStatuses.map((value) => ({ value, label: statusLabels[value] })),
              ],
              onChange: (value) => {
                const status = memberStatuses.find((candidate) => candidate === value)
                changeFilters({ ...filters, status: status ?? 'all' })
              },
            },
          ]}
          resultCount={visible.length}
          formatResultCount={(count) => `${String(count)} ${count === 1 ? 'member' : 'members'}`}
          onReset={() => {
            changeFilters(initialFilters)
          }}
          actions={
            <Button size="sm" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Add member
            </Button>
          }
        />
        <DataTable
          label={title}
          itemName="members"
          columns={columns}
          getRowId={(member) => member.id}
          state={state.status === 'ready' ? { status: 'ready', items: visible } : state}
          defaultSort={{ columnId: 'name', direction: 'asc' }}
          page={page}
          onPageChange={setPage}
          pageSize={pageSize}
          empty={
            filtered
              ? {
                  title: 'No members match',
                  description: 'Try a different search, or clear the filters.',
                  action: (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        changeFilters(initialFilters)
                      }}
                    >
                      Clear filters
                    </Button>
                  ),
                }
              : {
                  title: 'No members yet',
                  description: 'Add the first member to get started.',
                  action: (
                    <Button size="sm" onClick={openCreate}>
                      <Plus aria-hidden="true" />
                      Add member
                    </Button>
                  ),
                }
          }
          {...(onRetry ? { onRetry } : {})}
        />
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent {...(dialogContainer ? { container: dialogContainer } : {})}>
          <DialogHeader>
            <DialogTitle>{target.mode === 'edit' ? 'Edit member' : 'Add member'}</DialogTitle>
            <DialogDescription>
              {target.mode === 'edit'
                ? `Change the details or role of ${target.member.name}.`
                : 'They get the role you choose as soon as they accept the invitation.'}
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            key={target.mode === 'edit' ? target.member.id : 'new'}
            member={target.mode === 'edit' ? target.member : undefined}
            onSubmit={(values) =>
              target.mode === 'edit' ? onUpdate(target.member.id, values) : onCreate(values)
            }
            onDone={(message) => {
              setDialogOpen(false)
              setAnnouncement(message)
            }}
            onCancel={() => {
              setDialogOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  )
}
