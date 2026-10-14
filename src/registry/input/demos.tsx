import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function InputFieldDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="input-email" required>
        Email
      </Label>
      <Input
        id="input-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        aria-describedby="input-email-hint"
      />
      <p id="input-email-hint" className="text-xs text-muted-foreground">
        Used for release notes only.
      </p>
    </div>
  )
}

export function InputSizesDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input size="sm" aria-label="Small" placeholder="Small" />
      <Input size="md" aria-label="Medium" placeholder="Medium (default)" />
      <Input size="lg" aria-label="Large" placeholder="Large" />
    </div>
  )
}

export function InputValidationDemo() {
  const [slug, setSlug] = useState('Hello World')
  const invalid = !/^[a-z0-9-]*$/.test(slug)

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="input-slug">Slug</Label>
      <Input
        id="input-slug"
        value={slug}
        onChange={(event) => {
          setSlug(event.target.value)
        }}
        aria-invalid={invalid}
        aria-describedby="input-slug-message"
        spellCheck={false}
      />
      <p
        id="input-slug-message"
        className={invalid ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
      >
        {invalid
          ? 'Use lowercase letters, numbers, and hyphens only.'
          : `Published at /components/${slug || '…'}`}
      </p>
    </div>
  )
}

export function InputStatesDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input aria-label="Disabled" placeholder="Disabled" disabled />
      <Input aria-label="Read only" defaultValue="Read only" readOnly />
      <Input aria-label="Attachment" type="file" />
    </div>
  )
}
