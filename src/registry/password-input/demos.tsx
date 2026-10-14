import { useState } from 'react'

import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export function PasswordInputDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="password-current">Password</Label>
      <PasswordInput id="password-current" autoComplete="current-password" />
    </div>
  )
}

export function PasswordInputFieldDemo() {
  const [password, setPassword] = useState('short')
  const error = password.length < 12 ? 'Use at least 12 characters.' : null

  return (
    <Field required className="w-full max-w-sm">
      <FieldLabel>New password</FieldLabel>
      <FieldControl>
        <PasswordInput
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
          }}
        />
      </FieldControl>
      <FieldDescription>A passphrase of a few words is easiest to remember.</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  )
}
