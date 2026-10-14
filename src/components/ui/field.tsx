import { CircleAlert } from 'lucide-react'
import { Slot } from 'radix-ui'
import {
  createContext,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

type FieldPart = 'description' | 'error'

interface FieldContextValue {
  controlId: string
  descriptionId: string
  errorId: string
  invalid: boolean
  disabled: boolean
  required: boolean
  /** Ids of the description and error, only while they are rendered. */
  describedBy: string | undefined
  registerPart: (part: FieldPart) => () => void
}

const FieldContext = createContext<FieldContextValue | null>(null)

function useFieldContext(component: string): FieldContextValue {
  const context = use(FieldContext)
  if (!context) throw new Error(`<${component}> must be used inside <Field> or <FieldSet>.`)
  return context
}

interface FieldStateOptions {
  id: string | undefined
  invalid: boolean | undefined
  disabled: boolean
  required: boolean
}

function useFieldState({ id, invalid, disabled, required }: FieldStateOptions): FieldContextValue {
  const baseId = useId()
  const [parts, setParts] = useState({ description: 0, error: 0 })

  const registerPart = useCallback((part: FieldPart) => {
    setParts((current) => ({ ...current, [part]: current[part] + 1 }))
    return () => {
      setParts((current) => ({ ...current, [part]: current[part] - 1 }))
    }
  }, [])

  const descriptionId = `${baseId}-description`
  const errorId = `${baseId}-error`
  const hasError = parts.error > 0
  const describedBy =
    [parts.description > 0 ? descriptionId : null, hasError ? errorId : null]
      .filter((partId) => partId !== null)
      .join(' ') || undefined

  return {
    controlId: id ?? `${baseId}-control`,
    descriptionId,
    errorId,
    invalid: invalid ?? hasError,
    disabled,
    required,
    describedBy,
    registerPart,
  }
}

/** Tells the enclosing Field that a description or error is on screen, so the control references it. */
function useRegisterPart(part: FieldPart, present: boolean) {
  const { registerPart } = useFieldContext(part === 'error' ? 'FieldError' : 'FieldDescription')
  useLayoutEffect(() => (present ? registerPart(part) : undefined), [registerPart, part, present])
}

interface FieldStateProps {
  /** Mark the control invalid. Defaults to whether a FieldError with content is rendered. */
  invalid?: boolean
  /** Disable the control and dim the label. */
  disabled?: boolean
  /**
   * Show a required marker and set `aria-required` on the control. Native
   * `required` is left off so the form's own validation decides what is valid.
   */
  required?: boolean
}

export interface FieldProps extends ComponentProps<'div'>, FieldStateProps {
  /** `horizontal` puts a Checkbox or Switch before its label. */
  orientation?: 'vertical' | 'horizontal'
  /** Id for the control; generated when omitted. */
  controlId?: string
}

/**
 * Wires one control to its label, description, and error with generated ids:
 * the label names the control, the description and error describe it, and an
 * error sets `aria-invalid`. Works with any control, with or without a form
 * library; wrap the focusable element in `FieldControl`.
 */
export function Field({
  invalid,
  disabled = false,
  required = false,
  orientation = 'vertical',
  controlId,
  className,
  ...props
}: FieldProps) {
  const field = useFieldState({ id: controlId, invalid, disabled, required })
  return (
    <FieldContext value={field}>
      <div
        data-orientation={orientation}
        data-invalid={field.invalid || undefined}
        className={cn(
          'group/field grid min-w-0 gap-2',
          orientation === 'horizontal' &&
            'grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 *:data-[slot=field-description]:col-start-2 *:data-[slot=field-error]:col-start-2',
          className,
        )}
        {...props}
      />
    </FieldContext>
  )
}

export interface FieldSetProps
  extends Omit<ComponentProps<'fieldset'>, 'disabled'>, FieldStateProps {}

/**
 * Groups related controls, such as a set of checkboxes, under a FieldLegend.
 * A FieldDescription or FieldError placed directly inside describes the whole
 * group; each control inside still gets its own Field for its label.
 */
export function FieldSet({
  invalid,
  disabled = false,
  required = false,
  className,
  ...props
}: FieldSetProps) {
  const field = useFieldState({ id: undefined, invalid, disabled, required })
  return (
    <FieldContext value={field}>
      <fieldset
        disabled={disabled || undefined}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
        className={cn('group/field grid min-w-0 gap-3', className)}
        {...props}
      />
    </FieldContext>
  )
}

export function FieldLegend({ className, children, ...props }: ComponentProps<'legend'>) {
  const { required } = useFieldContext('FieldLegend')
  return (
    <legend
      className={cn(
        'mb-1 inline-flex items-center gap-1 text-sm leading-none font-medium group-has-disabled/field:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      ) : null}
    </legend>
  )
}

/** The Field's Label, pointed at the control and showing the required marker. */
export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { controlId, required } = useFieldContext('FieldLabel')
  return (
    <Label
      htmlFor={controlId}
      required={required}
      className={cn('group-has-disabled/field:opacity-50', className)}
      {...props}
    />
  )
}

/** Attributes that connect a control to its Field. */
export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  'aria-required': true | undefined
  disabled: true | undefined
}

/** The attributes FieldControl adds, for controls that cannot be wrapped. */
export function useFieldControlProps(): FieldControlProps {
  const field = useFieldContext('FieldControl')
  return {
    id: field.controlId,
    'aria-describedby': field.describedBy,
    'aria-invalid': field.invalid || undefined,
    'aria-required': field.required || undefined,
    disabled: field.disabled || undefined,
  }
}

/**
 * Merges the Field's id, `aria-describedby`, `aria-invalid`, `aria-required`,
 * and `disabled` onto its single child: the focusable element, such as an
 * Input or a SelectTrigger. Props set on the child win.
 */
export function FieldControl({ children }: { children: ReactElement }) {
  const controlProps = useFieldControlProps()
  return <Slot.Root {...controlProps}>{children}</Slot.Root>
}

export function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  const { descriptionId } = useFieldContext('FieldDescription')
  useRegisterPart('description', true)
  return (
    <p
      id={descriptionId}
      data-slot="field-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== ''
}

/**
 * The control's error message. Renders nothing without children, so it can
 * always be present. It is not a live region: on submit, move focus to the
 * first invalid control and the message is read as that control's description.
 */
export function FieldError({ className, children, ...props }: ComponentProps<'p'>) {
  const { errorId } = useFieldContext('FieldError')
  const present = hasContent(children)
  useRegisterPart('error', present)
  if (!present) return null
  return (
    <p
      id={errorId}
      data-slot="field-error"
      className={cn('flex items-start gap-1.5 text-xs text-destructive', className)}
      {...props}
    >
      <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
