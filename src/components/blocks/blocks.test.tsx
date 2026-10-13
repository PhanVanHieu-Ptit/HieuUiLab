import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'

import { ConfirmAction } from './confirm-action'
import { EmptyState } from './empty-state'
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
})
