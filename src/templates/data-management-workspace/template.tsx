import { Database, History, Users } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { ActivityList, type ActivityEntry } from '@/components/blocks/activity-list'
import { ConfirmAction } from '@/components/blocks/confirm-action'
import { CrudManagementPage, type ManagedMember } from '@/components/blocks/crud-management-page'
import {
  DataTable,
  type DataTableColumn,
  type DataTableState,
} from '@/components/blocks/data-table'
import { DetailPanel } from '@/components/blocks/detail-panel'
import { EmptyState } from '@/components/blocks/empty-state'
import {
  SearchFilterToolbar,
  type FilterToolbarFilter,
  type FilterToolbarValue,
  type FilterToolbarView,
} from '@/components/blocks/search-filter-toolbar'
import { Button } from '@/components/ui/button'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import {
  emailTaken,
  initialMembers,
  joinedAtForNewMembers,
  nextMemberId,
} from '@/registry/crud-management-page/mock-data'
import { ExampleOnlyNotice, MockPicker } from '@/registry/demo-controls'
import { mockDelay } from '@/registry/mock-delay'
import {
  filterItems,
  initialFilterValue,
  libraryItems,
  type LibraryItem,
} from '@/registry/search-filter-toolbar/mock-data'
import { formatUtc, minutesAfter } from '@/templates/shared/format'
import { TemplateShell } from '@/templates/shared/template-shell'

type ViewId = 'library' | 'people' | 'history'
type MockState = 'ready' | 'empty' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'Loaded' },
  { value: 'empty', label: 'No records' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

const categoryLabels: Record<LibraryItem['category'], string> = {
  forms: 'Forms',
  data: 'Data',
  feedback: 'Feedback',
  navigation: 'Navigation',
}

const statusLabels: Record<LibraryItem['status'], string> = {
  stable: 'Stable',
  beta: 'Beta',
  deprecated: 'Deprecated',
}

const statusTone: Record<LibraryItem['status'], StatusTone> = {
  stable: 'success',
  beta: 'info',
  deprecated: 'warning',
}

const toolbarFilters: readonly FilterToolbarFilter[] = [
  {
    id: 'category',
    label: 'Category',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'All categories' },
      ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
    ],
  },
  {
    id: 'status',
    label: 'Status',
    defaultValue: 'all',
    options: [
      { value: 'all', label: 'All statuses' },
      ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
    ],
  },
]

const toolbarViews: readonly FilterToolbarView[] = [
  { id: 'all', label: 'All items', value: initialFilterValue },
  {
    id: 'attention',
    label: 'Needs attention',
    value: { query: '', filters: { status: 'deprecated' }, sort: 'name-asc' },
  },
]

function LibraryView({
  mock,
  items,
  onMarkDeprecated,
  onDelete,
  onRetry,
}: {
  mock: MockState
  items: readonly LibraryItem[]
  onMarkDeprecated: (ids: ReadonlySet<string>) => void
  onDelete: (ids: ReadonlySet<string>) => void
  onRetry: () => void
}) {
  const headingId = useId()
  const [value, setValue] = useState<FilterToolbarValue>(initialFilterValue)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [openId, setOpenId] = useState<string | null>(null)

  // The "No records" mock state shows an empty library without touching the real items.
  const records = mock === 'empty' ? [] : items
  const results = filterItems(records, value)
  const count = selectedIds.size
  const open = items.find((item) => item.id === openId)

  const columns = useMemo<readonly DataTableColumn<LibraryItem>[]>(
    () => [
      { id: 'name', header: 'Name', rowHeader: true, cell: (item) => item.name },
      { id: 'category', header: 'Category', cell: (item) => categoryLabels[item.category] },
      {
        id: 'status',
        header: 'Status',
        cell: (item) => (
          <StatusBadge tone={statusTone[item.status]}>{statusLabels[item.status]}</StatusBadge>
        ),
      },
      { id: 'updated', header: 'Updated', cell: (item) => item.updated },
      {
        id: 'details',
        header: 'Details',
        align: 'end',
        cell: (item) => (
          <Button
            variant="ghost"
            size="sm"
            // The name starts with the visible label and says which row it belongs to.
            aria-label={`Details for ${item.name}`}
            onClick={() => {
              setOpenId(item.id)
            }}
          >
            Details
          </Button>
        ),
      },
    ],
    [],
  )

  const state: DataTableState<LibraryItem> =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the library service did not respond.' }
        : { status: 'ready', items: results }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          Library
        </h2>
        <p className="text-sm text-muted-foreground">
          Search, filter, select, and act on records, with the details one press away.
        </p>
      </header>
      <SearchFilterToolbar
        label="Search the library"
        searchLabel="Search items"
        searchPlaceholder="Name"
        value={value}
        onValueChange={setValue}
        views={toolbarViews}
        filters={toolbarFilters}
        sortOptions={[
          { value: 'name-asc', label: 'Name, A to Z' },
          { value: 'name-desc', label: 'Name, Z to A' },
          { value: 'updated', label: 'Recently updated' },
        ]}
        resultCount={results.length}
        formatResultCount={(total) => `${String(total)} of ${String(records.length)} items`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {count === 0 ? 'Select items to act on several at once.' : `${String(count)} selected`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={count === 0}
            onClick={() => {
              onMarkDeprecated(selectedIds)
              setSelectedIds(new Set())
            }}
          >
            Mark deprecated
          </Button>
          <ConfirmAction
            trigger={
              <Button variant="outline" size="sm" disabled={count === 0}>
                Delete…
              </Button>
            }
            title={count === 1 ? 'Delete 1 item?' : `Delete ${String(count)} items?`}
            description="The items are removed from this example library. Reload the page to get them back."
            confirmLabel="Delete"
            onConfirm={async () => {
              await mockDelay(400)
              onDelete(selectedIds)
              setSelectedIds(new Set())
            }}
          />
        </div>
      </div>
      <DataTable
        label="Library items"
        itemName="items"
        columns={columns}
        state={state}
        getRowId={(item) => item.id}
        defaultPageSize={6}
        activeRowId={openId}
        onRetry={onRetry}
        selection={{
          selectedIds,
          onSelectedIdsChange: setSelectedIds,
          rowLabel: (item) => `Select ${item.name}`,
        }}
        empty={
          mock === 'empty'
            ? { title: 'The library is empty', description: 'Records you add appear here.' }
            : {
                title: 'No items match',
                description: 'Try a different search, or remove a filter.',
                action: (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValue(initialFilterValue)
                    }}
                  >
                    Clear everything
                  </Button>
                ),
              }
        }
      />
      {/* A never-matching query keeps the panel a sheet, so it does not depend on the window. */}
      <DetailPanel
        open={open !== undefined}
        onOpenChange={(next) => {
          if (!next) setOpenId(null)
        }}
        inlineQuery="not all"
        title={open?.name ?? 'Item'}
        description={
          open ? `${categoryLabels[open.category]} · updated ${open.updated}` : undefined
        }
      >
        {open ? (
          <>
            <StatusBadge tone={statusTone[open.status]} className="self-start">
              {statusLabels[open.status]}
            </StatusBadge>
            <p className="text-sm">An example record, held in memory.</p>
          </>
        ) : null}
      </DetailPanel>
    </section>
  )
}

/**
 * A data workspace: a searchable library with bulk actions and a detail panel, a team page with
 * create, edit, and delete, and a history of every change made in either. The records and the
 * history are held here, so a deletion in one view shows up in the others.
 */
export function DataManagementWorkspaceTemplate() {
  const [view, setView] = useState<ViewId>('library')
  const [mock, setMock] = useState<MockState>('ready')
  const [items, setItems] = useState<readonly LibraryItem[]>(libraryItems)
  const [members, setMembers] = useState<readonly ManagedMember[]>(initialMembers)
  const [history, setHistory] = useState<readonly ActivityEntry[]>([])

  const retry = () => {
    setMock('ready')
  }

  /** Newest first; each change is one minute after the one before, so no clock is read. */
  const record = (action: string, target: string) => {
    setHistory((current) => [
      {
        id: `change-${String(current.length + 1)}`,
        actor: 'You',
        action,
        target,
        timestamp: minutesAfter(joinedAtForNewMembers, current.length + 1),
      },
      ...current,
    ])
  }

  const membersState: DataTableState<ManagedMember> =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the members service did not respond.' }
        : { status: 'ready', items: mock === 'empty' ? [] : members }

  const itemsLabel = (ids: ReadonlySet<string>) =>
    ids.size === 1 ? '1 library item' : `${String(ids.size)} library items`

  return (
    <TemplateShell
      appName="Content workspace"
      activeView={view}
      onViewChange={setView}
      views={[
        { id: 'library', label: 'Library', icon: <Database aria-hidden="true" /> },
        { id: 'people', label: 'People', icon: <Users aria-hidden="true" /> },
        {
          id: 'history',
          label: 'Change history',
          icon: <History aria-hidden="true" />,
          ...(history.length > 0
            ? {
                badge: {
                  text: String(history.length),
                  label: `${String(history.length)} ${history.length === 1 ? 'change' : 'changes'}`,
                },
              }
            : {}),
        },
      ]}
      controls={
        <div className="grid gap-3">
          <ExampleOnlyNotice>
            The records, people, and changes are invented and held in memory. Nothing is saved.
          </ExampleOnlyNotice>
          <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
        </div>
      }
    >
      {view === 'library' ? (
        <LibraryView
          mock={mock}
          items={items}
          onRetry={retry}
          onMarkDeprecated={(ids) => {
            setItems((current) =>
              current.map((item) => (ids.has(item.id) ? { ...item, status: 'deprecated' } : item)),
            )
            record('marked as deprecated', itemsLabel(ids))
          }}
          onDelete={(ids) => {
            setItems((current) => current.filter((item) => !ids.has(item.id)))
            record('deleted', itemsLabel(ids))
          }}
        />
      ) : null}
      {view === 'people' ? (
        <CrudManagementPage
          state={membersState}
          onRetry={retry}
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
            record('invited', values.name)
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
            record('updated', values.name)
            return { ok: true }
          }}
          onDelete={async (member) => {
            await mockDelay(400)
            setMembers((current) => current.filter((candidate) => candidate.id !== member.id))
            record('removed', member.name)
          }}
        />
      ) : null}
      {view === 'history' ? <HistoryView history={history} /> : null}
    </TemplateShell>
  )
}

function HistoryView({ history }: { history: readonly ActivityEntry[] }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          Change history
        </h2>
        <p className="text-sm text-muted-foreground">
          Every change made in the library or the team, newest first.
        </p>
      </header>
      {history.length === 0 ? (
        <EmptyState
          title="No changes yet"
          description="Delete or deprecate a library item, or add a team member, and it is listed here."
        />
      ) : (
        <ActivityList label="Change history" items={history} formatTimestamp={formatUtc} />
      )}
    </section>
  )
}
