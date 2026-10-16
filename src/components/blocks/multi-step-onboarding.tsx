import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CircleCheck } from 'lucide-react'
import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/cn'

const roles = ['designer', 'developer', 'product', 'founder', 'other'] as const
const roleLabels: Record<(typeof roles)[number], string> = {
  designer: 'Designer',
  developer: 'Developer',
  product: 'Product manager',
  founder: 'Founder',
  other: 'Something else',
}

const teamSizes = ['solo', 'small', 'medium', 'large'] as const
const teamSizeLabels: Record<(typeof teamSizes)[number], string> = {
  solo: 'Just me',
  small: '2–10 people',
  medium: '11–50 people',
  large: 'More than 50',
}

const goals = ['ship', 'organize', 'collaborate', 'explore'] as const
const goalLabels: Record<(typeof goals)[number], string> = {
  ship: 'Ship a project',
  organize: 'Get organised',
  collaborate: 'Work with my team',
  explore: 'Just exploring',
}

const profileStep = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your name (at least 2 characters).')
    .max(60, 'Use 60 characters or fewer.'),
  // A string first, so an unchosen (empty) select reports the message below.
  jobRole: z.string().pipe(z.enum(roles, 'Choose the role that fits you best.')),
})

const workspaceStep = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(2, 'Name your workspace (at least 2 characters).')
    .max(40, 'Use 40 characters or fewer.'),
  workspaceSlug: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(30, 'Use 30 characters or fewer.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens.'),
  teamSize: z.string().pipe(z.enum(teamSizes, 'Choose the size of your team.')),
})

const preferencesStep = z.object({
  goal: z.string().pipe(z.enum(goals, 'Choose what you want to do first.')),
  productTips: z.boolean(),
  shareUsage: z.boolean(),
})

/** Every rule the wizard enforces, step by step. The UI only displays this schema's results. */
export const onboardingSchema = profileStep
  .extend(workspaceStep.shape)
  .extend(preferencesStep.shape)

/** What the inputs hold while editing. */
export type OnboardingInput = z.input<typeof onboardingSchema>
/** What a valid submission delivers: trimmed text, and choices as their typed values. */
export type OnboardingValues = z.output<typeof onboardingSchema>

export type OnboardingStepId = 'profile' | 'workspace' | 'preferences' | 'review'

export interface MultiStepOnboardingProps {
  /**
   * Creates the workspace and reports the outcome. Return field errors the server found, such as a
   * taken address: the wizard goes back to the step that has the field. A rejected promise shows a
   * generic error. This block creates nothing itself.
   */
  onComplete: (values: OnboardingValues) => Promise<SubmitResult<OnboardingInput>>
  defaultValues?: Partial<OnboardingInput>
  /** The step to open on. Steps before it are treated as already done. */
  initialStep?: OnboardingStepId
  /** Called with the new step after every change of step. */
  onStepChange?: (step: OnboardingStepId) => void
  title?: string
  className?: string
}

interface Step {
  id: OnboardingStepId
  label: string
  description: string
  /** The fields asked on this step; the review step asks none. */
  fields: readonly FieldPath<OnboardingInput>[]
}

const steps = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Tell us who you are.',
    fields: ['fullName', 'jobRole'],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Name the place your team will work in.',
    fields: ['workspaceName', 'workspaceSlug', 'teamSize'],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Choose how you want to start.',
    fields: ['goal', 'productTips', 'shareUsage'],
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Check your answers, then create your workspace.',
    fields: [],
  },
] as const satisfies readonly Step[]

const lastIndex = steps.length - 1

const blankValues: OnboardingInput = {
  fullName: '',
  jobRole: '',
  workspaceName: '',
  workspaceSlug: '',
  teamSize: '',
  goal: '',
  productTips: true,
  shareUsage: false,
}

function stepIndexOf(id: OnboardingStepId): number {
  return Math.max(
    steps.findIndex((step) => step.id === id),
    0,
  )
}

function Stepper({
  current,
  reached,
  onGo,
}: {
  current: number
  /** The furthest step the user has been to; steps up to it can be jumped to. */
  reached: number
  onGo: (index: number) => void
}) {
  return (
    <>
      <p className="text-sm font-medium @lg:hidden">
        Step {current + 1} of {steps.length}:{' '}
        <span className="text-muted-foreground">{steps[current]?.label}</span>
      </p>
      <ol aria-label="Progress" className="hidden flex-wrap items-center gap-x-2 gap-y-2 @lg:flex">
        {steps.map((step, index) => {
          const state = index < current ? 'complete' : index === current ? 'current' : 'upcoming'
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  state === 'complete' && 'border-primary bg-primary text-primary-foreground',
                  state === 'current' && 'border-primary text-primary',
                  state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {state === 'complete' ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="sr-only">Step {index + 1}:</span>
              <span className={cn('text-sm', state === 'upcoming' && 'text-muted-foreground')}>
                {step.label}
              </span>
              {state === 'complete' ? <span className="sr-only">(completed)</span> : null}
            </>
          )
          return (
            <li
              key={step.id}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex items-center gap-2"
            >
              {index !== current && index <= reached ? (
                <button
                  type="button"
                  aria-label={`Step ${String(index + 1)}: ${step.label}${state === 'complete' ? ' (completed)' : ''}`}
                  onClick={() => {
                    onGo(index)
                  }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md focus-ring"
                >
                  {content}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2">{content}</span>
              )}
              {index < lastIndex ? (
                <span aria-hidden="true" className="h-px w-6 bg-border" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </>
  )
}

/** A select for a form field, with a placeholder while nothing is chosen. */
function ChoiceSelect({
  name,
  value,
  onChange,
  onBlur,
  triggerRef,
  options,
  placeholder,
}: {
  name: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  triggerRef: (node: HTMLButtonElement | null) => void
  options: readonly { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <Select name={name} value={value} onValueChange={onChange}>
      <FieldControl>
        <SelectTrigger ref={triggerRef} onBlur={onBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FieldControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 @lg:flex-row @lg:gap-4">
      <dt className="text-sm text-muted-foreground @lg:w-40 @lg:shrink-0">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-words">{value}</dd>
    </div>
  )
}

function labelOf(labels: Record<string, string>, value: string): string {
  return labels[value] ?? (value === '' ? 'Not chosen' : value)
}

/**
 * A guided setup in four steps (profile, workspace, preferences, review) on React Hook Form and
 * Zod. Each step is checked before the next opens, earlier steps can be revisited without losing
 * answers, and a final review lists everything with a way back to each part. Server errors send
 * the user back to the step with the field. It creates nothing: the result goes to `onComplete`.
 */
export function MultiStepOnboarding({
  onComplete,
  defaultValues,
  initialStep = 'profile',
  onStepChange,
  title = 'Set up your workspace',
  className,
}: MultiStepOnboardingProps) {
  const headingId = useId()
  const form = useForm<OnboardingInput, unknown, OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...blankValues, ...defaultValues },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { control, trigger } = form
  const values = useWatch({ control })
  const [index, setIndex] = useState(() => stepIndexOf(initialStep))
  const [reached, setReached] = useState(index)
  const [created, setCreated] = useState<string | null>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const createdHeadingRef = useRef<HTMLHeadingElement>(null)
  const focusStepHeading = useRef(false)
  const step: Step = steps[index] ?? steps[0]

  const { submit, pending, feedback, clearFeedback } = useFormSubmit(
    form,
    async (submitted) => {
      const result = await onComplete(submitted)
      if (result.ok) {
        setCreated(result.message ?? 'Your workspace has been created.')
        return result
      }
      // The field may be on an earlier step: open that step so the error and focus land there.
      const rejected = result.fieldErrors?.[0]?.name
      const target = steps.findIndex((candidate) =>
        candidate.fields.some((name) => name === rejected),
      )
      if (target !== -1 && target !== index) goTo(target, { focusStep: false, keepFeedback: true })
      return result
    },
    { failureMessage: 'We couldn’t create your workspace right now. Try again in a moment.' },
  )

  function goTo(next: number, options: { focusStep?: boolean; keepFeedback?: boolean } = {}) {
    const { focusStep = true, keepFeedback = false } = options
    focusStepHeading.current = focusStep
    if (!keepFeedback) clearFeedback()
    setIndex(next)
    setReached((current) => Math.max(current, next))
    const id = steps[next]?.id
    if (id) onStepChange?.(id)
  }

  // Moving between steps replaces the controls that had focus, which would drop it to the page.
  useEffect(() => {
    if (!focusStepHeading.current) return
    focusStepHeading.current = false
    stepHeadingRef.current?.focus()
  }, [index])

  useEffect(() => {
    if (created !== null) createdHeadingRef.current?.focus()
  }, [created])

  async function next() {
    if (await trigger(step.fields, { shouldFocus: true })) goTo(index + 1)
  }

  async function jumpTo(target: number) {
    // Going back needs no check; going forward needs this step to be sound first.
    if (target > index && !(await trigger(step.fields, { shouldFocus: true }))) return
    goTo(target)
  }

  const onFormSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    if (step.id === 'review') {
      submit(event)
      return
    }
    event.preventDefault()
    void next()
  }

  if (created !== null) {
    return (
      <section aria-labelledby={headingId} className={cn('@container w-full min-w-0', className)}>
        <Card className="mx-auto max-w-lg">
          <CardHeader className="items-center text-center">
            <CircleCheck aria-hidden="true" className="size-10 text-success" />
            <CardTitle
              as="h2"
              id={headingId}
              ref={createdHeadingRef}
              tabIndex={-1}
              className="text-xl outline-none"
            >
              Your workspace is ready
            </CardTitle>
            <CardDescription role="status">{created}</CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  const { errors } = form.formState
  const problemSteps = steps.filter(
    (candidate, candidateIndex) =>
      candidateIndex < lastIndex && candidate.fields.some((name) => errors[name]),
  )

  return (
    <section aria-labelledby={headingId} className={cn('@container w-full min-w-0', className)}>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-4">
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <Stepper
            current={index}
            reached={reached}
            onGo={(target) => {
              void jumpTo(target)
            }}
          />
        </header>
        <Card>
          <CardHeader>
            <CardTitle
              as="h3"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="rounded-sm text-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {step.label}
            </CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form noValidate onSubmit={onFormSubmit} aria-label={title} className="grid gap-5">
              <fieldset disabled={pending} className="grid min-w-0 gap-4 @xl:grid-cols-2">
                {step.id === 'profile' ? (
                  <>
                    <FormField
                      control={control}
                      name="fullName"
                      label="Full name"
                      required
                      render={({ field }) => (
                        <FieldControl>
                          <Input autoComplete="name" {...field} />
                        </FieldControl>
                      )}
                    />
                    <FormField
                      control={control}
                      name="jobRole"
                      label="Your role"
                      required
                      render={({ field }) => (
                        <ChoiceSelect
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          triggerRef={field.ref}
                          placeholder="Choose a role"
                          options={roles.map((value) => ({ value, label: roleLabels[value] }))}
                        />
                      )}
                    />
                  </>
                ) : null}
                {step.id === 'workspace' ? (
                  <>
                    <FormField
                      control={control}
                      name="workspaceName"
                      label="Workspace name"
                      required
                      render={({ field }) => (
                        <FieldControl>
                          <Input autoComplete="organization" {...field} />
                        </FieldControl>
                      )}
                    />
                    <FormField
                      control={control}
                      name="workspaceSlug"
                      label="Workspace address"
                      description="Lowercase letters, numbers, and hyphens."
                      required
                      render={({ field }) => (
                        <FieldControl>
                          <Input spellCheck={false} autoCapitalize="none" {...field} />
                        </FieldControl>
                      )}
                    />
                    <FormField
                      control={control}
                      name="teamSize"
                      label="Team size"
                      required
                      render={({ field }) => (
                        <ChoiceSelect
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          triggerRef={field.ref}
                          placeholder="Choose a size"
                          options={teamSizes.map((value) => ({
                            value,
                            label: teamSizeLabels[value],
                          }))}
                        />
                      )}
                    />
                  </>
                ) : null}
                {step.id === 'preferences' ? (
                  <>
                    <FormField
                      control={control}
                      name="goal"
                      label="What do you want to do first?"
                      required
                      className="@xl:col-span-2"
                      render={({ field }) => (
                        <ChoiceSelect
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          triggerRef={field.ref}
                          placeholder="Choose a goal"
                          options={goals.map((value) => ({ value, label: goalLabels[value] }))}
                        />
                      )}
                    />
                    <FormField
                      control={control}
                      name="productTips"
                      label="Send me product tips"
                      description="A short email now and then. Unsubscribe any time."
                      orientation="horizontal"
                      className="@xl:col-span-2"
                      render={({ field }) => (
                        <FieldControl>
                          <Switch
                            ref={field.ref}
                            name={field.name}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FieldControl>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shareUsage"
                      label="Share anonymous usage data"
                      description="Helps us improve the product. Nothing personal is included."
                      orientation="horizontal"
                      className="@xl:col-span-2"
                      render={({ field }) => (
                        <FieldControl>
                          <Switch
                            ref={field.ref}
                            name={field.name}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FieldControl>
                      )}
                    />
                  </>
                ) : null}
                {step.id === 'review' ? (
                  <div className="grid gap-5 @xl:col-span-2">
                    {steps.slice(0, lastIndex).map((section, sectionIndex) => (
                      <div key={section.id} className="grid gap-2 border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold">{section.label}</h4>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto px-0"
                            aria-label={`Edit ${section.label.toLowerCase()}`}
                            onClick={() => {
                              goTo(sectionIndex)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                        <dl className="grid gap-1.5">
                          {section.id === 'profile' ? (
                            <>
                              <ReviewRow label="Full name" value={values.fullName ?? ''} />
                              <ReviewRow
                                label="Role"
                                value={labelOf(roleLabels, values.jobRole ?? '')}
                              />
                            </>
                          ) : null}
                          {section.id === 'workspace' ? (
                            <>
                              <ReviewRow label="Name" value={values.workspaceName ?? ''} />
                              <ReviewRow label="Address" value={values.workspaceSlug ?? ''} />
                              <ReviewRow
                                label="Team size"
                                value={labelOf(teamSizeLabels, values.teamSize ?? '')}
                              />
                            </>
                          ) : null}
                          {section.id === 'preferences' ? (
                            <>
                              <ReviewRow
                                label="First goal"
                                value={labelOf(goalLabels, values.goal ?? '')}
                              />
                              <ReviewRow
                                label="Product tips"
                                value={values.productTips ? 'Yes' : 'No'}
                              />
                              <ReviewRow
                                label="Share usage data"
                                value={values.shareUsage ? 'Yes' : 'No'}
                              />
                            </>
                          ) : null}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : null}
              </fieldset>
              {step.id === 'review' && problemSteps.length > 0 ? (
                <FormFeedback status="error" title="Some answers need fixing" focusOnMount={false}>
                  Go back to:{' '}
                  {problemSteps.map((problem) => (
                    <Button
                      key={problem.id}
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-1 py-0"
                      onClick={() => {
                        goTo(stepIndexOf(problem.id))
                      }}
                    >
                      {problem.label}
                    </Button>
                  ))}
                </FormFeedback>
              ) : null}
              {feedback ? (
                <FormFeedback
                  key={feedback.id}
                  status={feedback.status}
                  title={
                    feedback.status === 'success' ? 'Workspace created' : 'Workspace not created'
                  }
                  focusOnMount={feedback.focus}
                >
                  {feedback.message}
                </FormFeedback>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  aria-disabled={index === 0 || pending}
                  onClick={() => {
                    if (index > 0 && !pending) goTo(index - 1)
                  }}
                >
                  Back
                </Button>
                <Button type="submit" loading={pending}>
                  {step.id === 'review'
                    ? pending
                      ? 'Creating…'
                      : 'Create workspace'
                    : index === lastIndex - 1
                      ? 'Review'
                      : 'Next'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
