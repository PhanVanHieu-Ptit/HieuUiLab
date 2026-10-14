import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldControl, FieldLabel } from '@/components/ui/field'
import { FormFeedback } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'

/** Example only: waits, then succeeds or fails. No request is sent. */
function mockSubscribe(shouldFail: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error('Mock failure'))
      else resolve()
    }, 700)
  })
}

export function FormFeedbackDemo() {
  return (
    <div className="grid w-full max-w-md gap-3">
      <FormFeedback status="success" title="Profile saved" focusOnMount={false} role="none">
        Your changes are visible to your team.
      </FormFeedback>
      <FormFeedback status="error" title="Profile not saved" focusOnMount={false} role="none">
        The service did not respond. Nothing was changed; try again.
      </FormFeedback>
    </div>
  )
}

export function FormFeedbackPlainFormDemo() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ id: number; ok: boolean } | null>(null)
  const [fail, setFail] = useState(false)

  return (
    <form
      className="grid w-full max-w-md gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setPending(true)
        setResult(null)
        mockSubscribe(fail)
          .then(() => {
            setResult((current) => ({ id: (current?.id ?? 0) + 1, ok: true }))
          })
          .catch(() => {
            setResult((current) => ({ id: (current?.id ?? 0) + 1, ok: false }))
          })
          .finally(() => {
            setPending(false)
          })
      }}
    >
      <fieldset disabled={pending} className="grid min-w-0 gap-4">
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldControl>
            <Input type="email" autoComplete="email" defaultValue="you@example.com" />
          </FieldControl>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={fail}
            onChange={(event) => {
              setFail(event.target.checked)
            }}
          />
          Make the mock request fail
        </label>
        <Button type="submit" loading={pending} className="justify-self-start">
          Subscribe
        </Button>
      </fieldset>
      {result ? (
        <FormFeedback
          key={result.id}
          status={result.ok ? 'success' : 'error'}
          title={result.ok ? 'Subscribed' : 'Not subscribed'}
        >
          {result.ok
            ? 'Example only: nothing was sent.'
            : 'The mock request failed. Your details are still here; try again.'}
        </FormFeedback>
      ) : null}
    </form>
  )
}
