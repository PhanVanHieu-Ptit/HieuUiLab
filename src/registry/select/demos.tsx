import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SelectDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Label htmlFor="select-timezone">Time zone</Label>
      <Select defaultValue="asia-ho-chi-minh">
        <SelectTrigger id="select-timezone">
          <SelectValue placeholder="Select a time zone" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value="asia-ho-chi-minh">Ho Chi Minh City (GMT+7)</SelectItem>
            <SelectItem value="asia-singapore">Singapore (GMT+8)</SelectItem>
            <SelectItem value="asia-tokyo">Tokyo (GMT+9)</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="europe-london">London (GMT+0)</SelectItem>
            <SelectItem value="europe-berlin">Berlin (GMT+1)</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function SelectControlledDemo() {
  const [sort, setSort] = useState('updated')

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Label htmlFor="select-sort">Sort by</Label>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger id="select-sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Recently updated</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="downloads" disabled>
            Downloads (coming soon)
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Current value: <code className="font-mono">{sort}</code>
      </p>
    </div>
  )
}

export function SelectFormDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null)

  return (
    <form
      className="flex w-full max-w-xs flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const value = new FormData(event.currentTarget).get('framework')
        setSubmitted(typeof value === 'string' ? value : null)
      }}
    >
      <Label htmlFor="select-framework" required>
        Framework
      </Label>
      <div className="flex gap-2">
        <Select name="framework" required>
          <SelectTrigger id="select-framework" size="sm">
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="react">React</SelectItem>
            <SelectItem value="vue">Vue</SelectItem>
            <SelectItem value="svelte">Svelte</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm">
          Submit
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {submitted
          ? `Submitted framework=${submitted}`
          : 'Required: the form will not submit without a choice.'}
      </p>
    </form>
  )
}
