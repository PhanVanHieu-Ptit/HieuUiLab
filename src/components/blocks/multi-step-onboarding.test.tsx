import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SubmitResult } from '@/components/ui/form'

import {
  MultiStepOnboarding,
  onboardingSchema,
  type MultiStepOnboardingProps,
  type OnboardingInput,
  type OnboardingValues,
} from './multi-step-onboarding'

type Handler = (values: OnboardingValues) => Promise<SubmitResult<OnboardingInput>>
type User = ReturnType<typeof userEvent.setup>

const answers: OnboardingInput = {
  fullName: '  Alex Nguyen ',
  jobRole: 'designer',
  workspaceName: ' Atlas Studio ',
  workspaceSlug: 'atlas-studio',
  teamSize: 'small',
  goal: 'ship',
  productTips: true,
  shareUsage: false,
}

/** A promise the test settles by hand, to observe the pending state. */
function deferred<T>() {
  let settle: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle?.(value) }
}

function renderWizard(props: Partial<MultiStepOnboardingProps> = {}) {
  const onComplete = vi.fn<Handler>(() => Promise.resolve({ ok: true }))
  render(<MultiStepOnboarding onComplete={onComplete} {...props} />)
  return onComplete
}

async function choose(user: User, name: string, option: string) {
  screen.getByRole('combobox', { name }).focus()
  await user.keyboard('{Enter}')
  await user.click(await screen.findByRole('option', { name: option }))
}

function stepHeading(name: string) {
  return screen.getByRole('heading', { level: 3, name })
}

function progress() {
  return within(screen.getByRole('list', { name: 'Progress' }))
}

function currentStep() {
  return progress()
    .getAllByRole('listitem')
    .find((item) => item.getAttribute('aria-current') === 'step')
}

async function next(user: User, label = 'Next') {
  await user.click(screen.getByRole('button', { name: label }))
}

async function completeProfile(user: User) {
  await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Alex Nguyen')
  await choose(user, 'Your role', 'Designer')
  await next(user)
}

async function completeWorkspace(user: User) {
  await user.type(screen.getByRole('textbox', { name: 'Workspace name' }), 'Atlas Studio')
  await user.type(screen.getByRole('textbox', { name: 'Workspace address' }), 'atlas-studio')
  await choose(user, 'Team size', '2–10 people')
  await next(user)
}

async function completePreferences(user: User) {
  await choose(user, 'What do you want to do first?', 'Ship a project')
  await next(user, 'Review')
}

describe('onboardingSchema', () => {
  it('trims text and keeps typed choices', () => {
    expect(onboardingSchema.parse(answers)).toEqual({
      ...answers,
      fullName: 'Alex Nguyen',
      workspaceName: 'Atlas Studio',
    })
  })

  it.each<[string, Partial<OnboardingInput>, string]>([
    ['a short name', { fullName: ' A ' }, 'fullName: Enter your name (at least 2 characters).'],
    ['no role', { jobRole: '' }, 'jobRole: Choose the role that fits you best.'],
    ['an unknown role', { jobRole: 'wizard' }, 'jobRole: Choose the role that fits you best.'],
    [
      'a short workspace name',
      { workspaceName: 'A' },
      'workspaceName: Name your workspace (at least 2 characters).',
    ],
    ['a short address', { workspaceSlug: 'ab' }, 'workspaceSlug: Use at least 3 characters.'],
    [
      'an address with capitals',
      { workspaceSlug: 'Atlas' },
      'workspaceSlug: Use lowercase letters, numbers, and single hyphens.',
    ],
    [
      'an address with a double hyphen',
      { workspaceSlug: 'atlas--studio' },
      'workspaceSlug: Use lowercase letters, numbers, and single hyphens.',
    ],
    ['no team size', { teamSize: '' }, 'teamSize: Choose the size of your team.'],
    ['no goal', { goal: '' }, 'goal: Choose what you want to do first.'],
  ])('rejects %s', (_case, input, message) => {
    const result = onboardingSchema.safeParse({ ...answers, ...input })
    expect(
      result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    ).toEqual([message])
  })
})

describe('MultiStepOnboarding', () => {
  it('starts on the first step and shows the progress', () => {
    renderWizard({ title: 'Welcome' })

    expect(screen.getByRole('heading', { level: 2, name: 'Welcome' })).toBeInTheDocument()
    expect(stepHeading('Profile')).toBeInTheDocument()
    expect(progress().getAllByRole('listitem')).toHaveLength(4)
    expect(currentStep()).toHaveTextContent('Profile')
    expect(screen.getByText(/Step 1 of 4:/)).toHaveTextContent('Step 1 of 4: Profile')
    expect(document.activeElement).toBe(document.body)
  })

  it('opens on initialStep with the steps before it reached', () => {
    renderWizard({ initialStep: 'workspace' })

    expect(stepHeading('Workspace')).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent('Workspace')
    expect(progress().getByRole('button', { name: /Profile/ })).toBeInTheDocument()
  })

  describe('validation', () => {
    it('blocks Next on an empty step, describes each error, and focuses the first', async () => {
      const user = userEvent.setup()
      renderWizard()

      await next(user)

      const name = screen.getByRole('textbox', { name: 'Full name' })
      expect(name).toHaveFocus()
      expect(name).toBeInvalid()
      expect(name).toHaveAccessibleDescription('Enter your name (at least 2 characters).')
      expect(screen.getByRole('combobox', { name: 'Your role' })).toBeInvalid()
      expect(stepHeading('Profile')).toBeInTheDocument()
      expect(currentStep()).toHaveTextContent('Profile')
    })

    it('only checks the fields of the current step', async () => {
      const user = userEvent.setup()
      renderWizard()

      await completeProfile(user)

      expect(stepHeading('Workspace')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Workspace name' })).not.toBeInvalid()
    })

    it('marks the step’s fields as required', () => {
      renderWizard()

      expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveAttribute(
        'aria-required',
        'true',
      )
      expect(screen.getByRole('combobox', { name: 'Your role' })).toHaveAttribute(
        'aria-required',
        'true',
      )
    })

    it('explains an invalid address', async () => {
      const user = userEvent.setup()
      renderWizard({ initialStep: 'workspace' })

      await user.type(screen.getByRole('textbox', { name: 'Workspace name' }), 'Atlas')
      await user.type(screen.getByRole('textbox', { name: 'Workspace address' }), 'Atlas Studio')
      await choose(user, 'Team size', 'Just me')
      await next(user)

      expect(
        screen.getByRole('textbox', { name: 'Workspace address' }),
      ).toHaveAccessibleDescription(
        'Lowercase letters, numbers, and hyphens. Use lowercase letters, numbers, and single hyphens.',
      )
      expect(stepHeading('Workspace')).toBeInTheDocument()
    })
  })

  describe('moving between steps', () => {
    it('advances after a valid step, marks it done, and focuses the new heading', async () => {
      const user = userEvent.setup()
      const onStepChange = vi.fn()
      renderWizard({ onStepChange })

      await completeProfile(user)

      expect(stepHeading('Workspace')).toHaveFocus()
      expect(currentStep()).toHaveTextContent('Workspace')
      expect(progress().getByText('(completed)')).toBeInTheDocument()
      expect(onStepChange).toHaveBeenLastCalledWith('workspace')
    })

    it('keeps the answers when the user goes back', async () => {
      const user = userEvent.setup()
      renderWizard()

      await completeProfile(user)
      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(stepHeading('Profile')).toHaveFocus()
      expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('Alex Nguyen')
      expect(screen.getByRole('combobox', { name: 'Your role' })).toHaveTextContent('Designer')
    })

    it('has a Back button that does nothing on the first step', async () => {
      const user = userEvent.setup()
      renderWizard()
      const back = screen.getByRole('button', { name: 'Back' })

      expect(back).toHaveAttribute('aria-disabled', 'true')
      await user.click(back)

      expect(stepHeading('Profile')).toBeInTheDocument()
    })

    it('lets the user go back to a reached step from the progress list', async () => {
      const user = userEvent.setup()
      renderWizard()
      await completeProfile(user)

      await user.click(progress().getByRole('button', { name: /Profile/ }))

      expect(stepHeading('Profile')).toBeInTheDocument()
      // The Workspace step was reached, so it can be jumped back to.
      expect(progress().getByRole('button', { name: /Workspace/ })).toBeInTheDocument()
    })

    it('does not let the user skip to a step they have not reached', async () => {
      const user = userEvent.setup()
      renderWizard()

      expect(progress().queryByRole('button')).toBeNull()
      await completeProfile(user)
      expect(progress().queryByRole('button', { name: /Preferences/ })).toBeNull()
      expect(progress().queryByRole('button', { name: /Review/ })).toBeNull()
    })

    it('checks the current step before jumping forward from the progress list', async () => {
      const user = userEvent.setup()
      renderWizard()
      await completeProfile(user)
      await user.click(progress().getByRole('button', { name: /Profile/ }))
      await user.clear(screen.getByRole('textbox', { name: 'Full name' }))

      await user.click(progress().getByRole('button', { name: /Workspace/ }))

      expect(stepHeading('Profile')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Full name' })).toBeInvalid()
    })

    it('moves on when Enter is pressed in a field', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Alex Nguyen')
      await choose(user, 'Your role', 'Designer')
      await user.type(screen.getByRole('textbox', { name: 'Full name' }), '{Enter}')

      expect(
        await screen.findByRole('heading', { level: 3, name: 'Workspace' }),
      ).toBeInTheDocument()
    })
  })

  describe('review', () => {
    async function toReview(user: User) {
      await completeProfile(user)
      await completeWorkspace(user)
      await completePreferences(user)
    }

    it('names the last form step’s button Review and the final one Create workspace', async () => {
      const user = userEvent.setup()
      renderWizard()
      await completeProfile(user)
      await completeWorkspace(user)

      expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument()
      await completePreferences(user)

      expect(stepHeading('Review')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create workspace' })).toBeInTheDocument()
    })

    it('lists every answer', async () => {
      const user = userEvent.setup()
      renderWizard()

      await toReview(user)

      const summary = screen.getByRole('form', { name: 'Set up your workspace' })
      for (const text of [
        'Alex Nguyen',
        'Designer',
        'Atlas Studio',
        'atlas-studio',
        '2–10 people',
        'Ship a project',
      ]) {
        expect(within(summary).getByText(text)).toBeInTheDocument()
      }
      expect(within(summary).getByText('Product tips').nextElementSibling).toHaveTextContent('Yes')
      expect(within(summary).getByText('Share usage data').nextElementSibling).toHaveTextContent(
        'No',
      )
    })

    it('takes the user back to the step they choose to edit', async () => {
      const user = userEvent.setup()
      renderWizard()
      await toReview(user)

      await user.click(screen.getByRole('button', { name: 'Edit workspace' }))

      expect(stepHeading('Workspace')).toHaveFocus()
      expect(screen.getByRole('textbox', { name: 'Workspace address' })).toHaveValue('atlas-studio')
    })

    it('says which steps to revisit when earlier answers are missing', async () => {
      const user = userEvent.setup()
      renderWizard({ initialStep: 'review' })

      await user.click(screen.getByRole('button', { name: 'Create workspace' }))

      const feedback = await screen.findByRole('alert')
      expect(feedback).toHaveTextContent('Some answers need fixing')
      await user.click(within(feedback).getByRole('button', { name: 'Workspace' }))
      expect(stepHeading('Workspace')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Workspace name' })).toBeInvalid()
    })
  })

  describe('creating the workspace', () => {
    it('submits the parsed answers and shows the confirmation', async () => {
      const user = userEvent.setup()
      const onComplete = renderWizard({
        initialStep: 'review',
        defaultValues: answers,
      })
      // renderWizard renders once; the handler is the one it created.
      await user.click(screen.getByRole('button', { name: 'Create workspace' }))

      expect(onComplete).toHaveBeenCalledExactlyOnceWith({
        ...answers,
        fullName: 'Alex Nguyen',
        workspaceName: 'Atlas Studio',
      })
      const heading = await screen.findByRole('heading', {
        level: 2,
        name: 'Your workspace is ready',
      })
      expect(heading).toHaveFocus()
      expect(screen.getByRole('status')).toHaveTextContent('Your workspace has been created.')
    })

    it('shows the handler’s own message', async () => {
      const user = userEvent.setup()
      renderWizard({
        initialStep: 'review',
        defaultValues: answers,
        onComplete: () => Promise.resolve({ ok: true, message: 'Atlas Studio is ready.' }),
      })

      await user.click(screen.getByRole('button', { name: 'Create workspace' }))

      expect(await screen.findByRole('status')).toHaveTextContent('Atlas Studio is ready.')
    })

    it('disables the form while creating', async () => {
      const user = userEvent.setup()
      const pending = deferred<SubmitResult<OnboardingInput>>()
      renderWizard({
        initialStep: 'review',
        defaultValues: answers,
        onComplete: () => pending.promise,
      })

      await user.click(screen.getByRole('button', { name: 'Create workspace' }))

      const button = screen.getByRole('button', { name: 'Creating…' })
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByRole('button', { name: 'Back' })).toHaveAttribute('aria-disabled', 'true')

      pending.resolve({ ok: true })
      expect(
        await screen.findByRole('heading', { name: 'Your workspace is ready' }),
      ).toBeInTheDocument()
    })

    it('goes back to the step with a field the server rejected', async () => {
      const user = userEvent.setup()
      renderWizard({
        initialStep: 'review',
        defaultValues: answers,
        onComplete: () =>
          Promise.resolve({
            ok: false,
            message: 'Some details need your attention.',
            fieldErrors: [{ name: 'workspaceSlug', message: '“atlas-studio” is already taken.' }],
          }),
      })

      await user.click(screen.getByRole('button', { name: 'Create workspace' }))

      expect(
        await screen.findByRole('heading', { level: 3, name: 'Workspace' }),
      ).toBeInTheDocument()
      const slug = screen.getByRole('textbox', { name: 'Workspace address' })
      expect(slug).toBeInvalid()
      expect(slug).toHaveAccessibleDescription(
        'Lowercase letters, numbers, and hyphens. “atlas-studio” is already taken.',
      )
      await waitFor(() => {
        expect(slug).toHaveFocus()
      })
      expect(screen.getByRole('alert')).toHaveTextContent('Workspace not created')
      expect(currentStep()).toHaveTextContent('Workspace')
    })

    it('stays on the review step with a generic message when the handler rejects', async () => {
      const user = userEvent.setup()
      renderWizard({
        initialStep: 'review',
        defaultValues: answers,
        onComplete: () => Promise.reject(new Error('Mock: unavailable')),
      })

      await user.click(screen.getByRole('button', { name: 'Create workspace' }))

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(
        'We couldn’t create your workspace right now. Try again in a moment.',
      )
      expect(alert).not.toHaveTextContent('unavailable')
      expect(stepHeading('Review')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Edit profile' }))
      expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('  Alex Nguyen ')
    })

    it('clears an old error when the user moves to another step', async () => {
      const user = userEvent.setup()
      renderWizard({
        initialStep: 'review',
        defaultValues: answers,
        onComplete: () => Promise.reject(new Error('Mock: unavailable')),
      })
      await user.click(screen.getByRole('button', { name: 'Create workspace' }))
      await screen.findByRole('alert')

      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(screen.queryByRole('alert')).toBeNull()
    })
  })
})
