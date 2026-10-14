import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

export interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues,
> {
  control: Control<TFieldValues, unknown, TTransformedValues>
  name: TName
  label: ReactNode
  description?: ReactNode
  /** Visual marker and `aria-required`. Derive it from your schema rather than restating rules. */
  required?: boolean
  disabled?: boolean
  /** `horizontal` puts a Checkbox or Switch before its label. */
  orientation?: 'vertical' | 'horizontal'
  /** Fields to validate again when this one changes, e.g. the end of a date range. */
  deps?: FieldPath<TFieldValues> | FieldPath<TFieldValues>[]
  className?: string
  /** Render the control, wrapping its focusable element in `FieldControl`. Pass `field.ref` to it. */
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>
    fieldState: ControllerFieldState
  }) => ReactElement
}

/**
 * A Field bound to one React Hook Form value through `Controller`: the label,
 * description, and the schema's error message for that value, wired to the
 * control. Validation stays in the resolver; this only displays its result.
 */
export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues,
>({
  control,
  name,
  label,
  description,
  required = false,
  disabled = false,
  orientation = 'vertical',
  deps,
  className,
  render,
}: FormFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      control={control}
      name={name}
      {...(deps === undefined ? {} : { rules: { deps } })}
      render={({ field, fieldState }) => {
        const controlElement = render({ field, fieldState })
        return (
          <Field
            invalid={fieldState.invalid}
            required={required}
            disabled={disabled}
            orientation={orientation}
            {...(className === undefined ? {} : { className })}
          >
            {orientation === 'horizontal' ? (
              <>
                {controlElement}
                <FieldLabel>{label}</FieldLabel>
              </>
            ) : (
              <>
                <FieldLabel>{label}</FieldLabel>
                {controlElement}
              </>
            )}
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )
      }}
    />
  )
}

/**
 * What a submit handler reports back. Failures carry a form-level message and,
 * optionally, messages for specific fields, such as "That username is taken".
 */
export type SubmitResult<TFieldValues extends FieldValues> =
  | { ok: true; message?: string }
  | {
      ok: false
      message: string
      fieldErrors?: readonly { name: FieldPath<TFieldValues>; message: string }[]
    }

export interface SubmitFeedback {
  /** Changes on every settled submission; use it as the feedback's `key` so it is focused again. */
  id: number
  status: 'success' | 'error'
  message: string
  /** Whether focus should go to the feedback, or stay on a field the server rejected. */
  focus: boolean
}

export interface UseFormSubmitOptions {
  /** Shown when the handler succeeds without a message of its own. */
  successMessage?: string
  /** Shown when the handler throws or rejects instead of returning a result. */
  failureMessage?: string
}

/**
 * Runs a submit handler after the resolver accepts the values and tracks the
 * outcome: `pending` while it runs, then success or failure feedback. Field
 * errors from the result are set on their fields (and replaced by the schema's
 * own errors as soon as the value changes); the first one is focused.
 */
export function useFormSubmit<TFieldValues extends FieldValues, TContext, TTransformedValues>(
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>,
  onSubmit: (values: TTransformedValues) => Promise<SubmitResult<TFieldValues>>,
  {
    successMessage = 'Saved.',
    failureMessage = 'Something went wrong, and nothing was saved. Try again.',
  }: UseFormSubmitOptions = {},
) {
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null)
  const [focusField, setFocusField] = useState<{ name: FieldPath<TFieldValues> } | null>(null)
  const submissions = useRef(0)
  const { handleSubmit, setError, setFocus } = form

  // Focus a rejected field only after the form is enabled again.
  useEffect(() => {
    if (!pending && focusField) setFocus(focusField.name)
  }, [pending, focusField, setFocus])

  async function handleValid(values: TTransformedValues) {
    setPending(true)
    setFeedback(null)
    setFocusField(null)
    let result: SubmitResult<TFieldValues>
    try {
      result = await onSubmit(values)
    } catch {
      result = { ok: false, message: failureMessage }
    }
    setPending(false)

    if (result.ok) {
      setFeedback({
        id: ++submissions.current,
        status: 'success',
        message: result.message ?? successMessage,
        focus: true,
      })
      return
    }
    const fieldErrors = result.fieldErrors ?? []
    for (const error of fieldErrors) {
      setError(error.name, { type: 'server', message: error.message })
    }
    setError('root.server', { type: 'server', message: result.message })
    const [firstField] = fieldErrors
    if (firstField) setFocusField({ name: firstField.name })
    setFeedback({
      id: ++submissions.current,
      status: 'error',
      message: result.message,
      focus: firstField === undefined,
    })
  }

  return {
    /** Pass to the form's `onSubmit`. */
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      void handleSubmit(handleValid, () => {
        setFeedback(null)
      })(event)
    },
    pending,
    feedback,
    clearFeedback: () => {
      setFeedback(null)
    },
  }
}
