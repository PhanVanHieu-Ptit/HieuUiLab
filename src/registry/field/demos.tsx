import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export function FieldDemo() {
  return (
    <Field required className="w-full max-w-sm">
      <FieldLabel>Email</FieldLabel>
      <FieldControl>
        <Input type="email" autoComplete="email" placeholder="you@example.com" />
      </FieldControl>
      <FieldDescription>We only use it to send release notes.</FieldDescription>
    </Field>
  )
}

export function FieldErrorDemo() {
  const [slug, setSlug] = useState('Hello World')
  const error = /^[a-z0-9-]*$/.test(slug)
    ? null
    : 'Use lowercase letters, numbers, and hyphens only.'

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Slug</FieldLabel>
      <FieldControl>
        <Input
          value={slug}
          spellCheck={false}
          onChange={(event) => {
            setSlug(event.target.value)
          }}
        />
      </FieldControl>
      <FieldDescription>Published at /components/{slug || '…'}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

export function FieldControlsDemo() {
  const [plan, setPlan] = useState('team')
  const [weekly, setWeekly] = useState(true)
  const [terms, setTerms] = useState(false)

  return (
    <div className="grid w-full max-w-md gap-5">
      <Field>
        <FieldLabel>Notes</FieldLabel>
        <FieldControl>
          <Textarea placeholder="Anything we should know?" />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel>Plan</FieldLabel>
        <Select value={plan} onValueChange={setPlan}>
          <FieldControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="solo">Solo</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Start date</FieldLabel>
        <FieldControl>
          <Input type="date" />
        </FieldControl>
        <FieldDescription>Uses the browser’s native date picker.</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldControl>
          <Switch checked={weekly} onCheckedChange={setWeekly} />
        </FieldControl>
        <FieldLabel>Weekly summary</FieldLabel>
        <FieldDescription>
          {weekly ? 'Sent every Monday.' : 'You will not get summaries.'}
        </FieldDescription>
      </Field>
      <Field orientation="horizontal" disabled>
        <FieldControl>
          <Checkbox
            checked={terms}
            onCheckedChange={(checked) => {
              setTerms(checked === true)
            }}
          />
        </FieldControl>
        <FieldLabel>Accept terms (disabled)</FieldLabel>
      </Field>
    </div>
  )
}

export function FieldSetDemo() {
  const [channels, setChannels] = useState<string[]>([])
  const options = ['Email', 'SMS', 'Push']

  return (
    <FieldSet required className="w-full max-w-sm">
      <FieldLegend>Notify me by</FieldLegend>
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {options.map((option) => (
          <Field key={option} orientation="horizontal">
            <FieldControl>
              <Checkbox
                checked={channels.includes(option)}
                onCheckedChange={(checked) => {
                  setChannels((current) =>
                    checked === true
                      ? [...current, option]
                      : current.filter((value) => value !== option),
                  )
                }}
              />
            </FieldControl>
            <FieldLabel>{option}</FieldLabel>
          </Field>
        ))}
      </div>
      <FieldError>{channels.length === 0 ? 'Choose at least one channel.' : null}</FieldError>
    </FieldSet>
  )
}
