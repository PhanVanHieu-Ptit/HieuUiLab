import { useId, useState, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { DraftCheck } from '../controls'

interface DraftFieldProps<T extends string | number> {
  label: string
  /** The committed value: what the preview currently shows. */
  value: T
  type: 'text' | 'number'
  /** Decides whether what was typed may become the value. */
  check: (text: string) => DraftCheck<T>
  onCommit: (value: T) => void
  /** Shown under the field, linked with aria-describedby. */
  hint?: ReactNode
  min?: number
  max?: number
  step?: number
  maxLength?: number
}

/**
 * A text or number field that keeps what the user types apart from the value the preview uses.
 * Only text that passes `check` is committed; anything else is shown as an error and the
 * preview keeps the last good value. Leaving the field puts the committed value back.
 */
export function DraftField<T extends string | number>({
  label,
  value,
  type,
  check,
  onCommit,
  hint,
  min,
  max,
  step,
  maxLength,
}: DraftFieldProps<T>) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  // Null while the field just shows the committed value.
  const [draft, setDraft] = useState<string | null>(null)

  const result = draft === null ? undefined : check(draft)
  const error = result && !result.ok ? result.message : undefined
  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={draft ?? String(value)}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...(min === undefined ? {} : { min })}
        {...(max === undefined ? {} : { max })}
        {...(step === undefined ? {} : { step })}
        {...(maxLength === undefined ? {} : { maxLength })}
        onChange={(event) => {
          const text = event.target.value
          setDraft(text)
          const checked = check(text)
          if (checked.ok) onCommit(checked.value)
        }}
        onBlur={() => {
          setDraft(null)
        }}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
