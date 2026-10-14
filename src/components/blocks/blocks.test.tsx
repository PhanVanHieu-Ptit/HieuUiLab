import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'

import { ActivityList } from './activity-list'
import { ConfirmAction } from './confirm-action'
import { EmptyState } from './empty-state'
import { ErrorState } from './error-state'
import { ResourceList, type ResourceState } from './resource-list'

describe('EmptyState', () => {
  it('renders the title at the requested heading level with actions', () => {
    render(
      <EmptyState
        headingLevel="h2"
        title="No projects yet"
        description="Create one to start."
        actions={<Button>Create project</Button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'No projects yet' })).toBeInTheDocument()
    expect(screen.getByText('Create one to start.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create project' })).toBeInTheDocument()
  })
})

describe('ResourceList', () => {
  const props = {
    label: 'saved views',
    getKey: (item: string) => item,
    renderItem: (item: string) => item,
  }

  function renderState(state: ResourceState<string>, onRetry?: () => void) {
    return render(<ResourceList {...props} state={state} {...(onRetry ? { onRetry } : {})} />)
  }

  it('announces loading', () => {
    renderState({ status: 'loading' })
    expect(screen.getByRole('status')).toHaveTextContent('Loading saved views…')
  })

  it('shows an alert with a retry action on error', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderState({ status: 'error', message: 'The request timed out.' }, onRetry)

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load saved views')
    expect(screen.getByRole('alert')).toHaveTextContent('The request timed out.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders the empty state when ready with no items', () => {
    renderState({ status: 'ready', items: [] })
    expect(screen.getByRole('heading', { name: 'No saved views yet' })).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders a labelled list when ready', () => {
    renderState({ status: 'ready', items: ['Open issues', 'Accessibility'] })
    expect(screen.getByRole('list', { name: 'saved views' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('ConfirmAction', () => {
  function renderConfirm(onConfirm: () => Promise<void>) {
    return render(
      <ConfirmAction
        trigger={<Button>Remove view</Button>}
        title="Remove this view?"
        description="This cannot be undone."
        confirmLabel="Remove"
        onConfirm={onConfirm}
      />,
    )
  }

  it('closes after the action succeeds and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(() => Promise.resolve())
    renderConfirm(onConfirm)
    const trigger = screen.getByRole('button', { name: 'Remove view' })

    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Remove this view?' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })

  it('stays open and shows the error when the action fails', async () => {
    const user = userEvent.setup()
    renderConfirm(() => Promise.reject(new Error('The server did not respond.')))

    await user.click(screen.getByRole('button', { name: 'Remove view' }))
    await user.click(await screen.findByRole('button', { name: 'Remove' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The server did not respond.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape without confirming', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(() => Promise.resolve())
    renderConfirm(onConfirm)

    await user.click(screen.getByRole('button', { name: 'Remove view' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('styles the confirm button by confirmVariant, destructive by default', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmAction
        trigger={<Button>Publish</Button>}
        title="Publish 4 changes?"
        description="They go live for every visitor."
        confirmLabel="Publish now"
        confirmVariant="default"
        onConfirm={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const confirm = await screen.findByRole('button', { name: 'Publish now' })
    expect(confirm).toHaveClass('bg-primary')
    expect(confirm).not.toHaveClass('bg-destructive')
  })

  it('does not open when the trigger prevents its click', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmAction
        trigger={
          <Button
            aria-disabled
            onClick={(event) => {
              event.preventDefault()
            }}
          >
            Cancel orders
          </Button>
        }
        title="Cancel 0 orders?"
        description="Nothing is selected."
        confirmLabel="Cancel orders"
        onConfirm={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel orders' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('ErrorState', () => {
  it('is announced as an alert with a default message', () => {
    render(<ErrorState />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong')
    expect(alert).toHaveTextContent('Check your connection, then try again.')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('puts retry before other actions', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <ErrorState
        title="Couldn’t load invoices"
        onRetry={onRetry}
        retryLabel="Reload invoices"
        actions={<Button>Contact support</Button>}
      />,
    )
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Reload invoices',
      'Contact support',
    ])
    await user.click(screen.getByRole('button', { name: 'Reload invoices' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('ActivityList', () => {
  const items = [
    {
      id: '2',
      actor: 'Mai Tran',
      action: 'marked as shipped',
      target: 'order #1052',
      timestamp: '2026-10-12T16:42:00Z',
    },
    {
      id: '1',
      actor: 'Warehouse sync',
      action: 'imported 128 products',
      timestamp: '2026-10-11T08:00:00Z',
    },
  ]

  it('renders an ordered list of sentences with machine-readable times', () => {
    render(
      <ActivityList
        label="Recent activity"
        items={items}
        formatTimestamp={(iso) => `at ${iso.slice(0, 10)}`}
      />,
    )
    const list = screen.getByRole('list', { name: 'Recent activity' })
    expect(list.tagName).toBe('OL')
    const entries = within(list).getAllByRole('listitem')
    expect(entries[0]).toHaveTextContent('Mai Tran marked as shipped order #1052')
    expect(entries[1]).toHaveTextContent('Warehouse sync imported 128 products')
    expect(within(list).getByText('at 2026-10-12')).toHaveAttribute(
      'datetime',
      '2026-10-12T16:42:00Z',
    )
  })

  it('shows a message instead of an empty list', () => {
    render(<ActivityList label="Recent activity" items={[]} emptyMessage="Nothing yet." />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('Nothing yet.')).toBeInTheDocument()
  })
})
