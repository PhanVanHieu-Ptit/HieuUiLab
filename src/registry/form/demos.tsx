import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldControl } from '@/components/ui/field'
import { FormField, useFormSubmit, type SubmitResult } from '@/components/ui/form'
import { FormFeedback } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address.')
    .pipe(z.email('Enter an email address like name@example.com.')),
  admin: z.boolean(),
})

type InviteInput = z.input<typeof inviteSchema>
type InviteValues = z.output<typeof inviteSchema>

const blankInvite: InviteInput = { email: '', admin: false }
// Fields the schema rejects when blank get the required marker.
const requiredFields = new Set(
  inviteSchema.safeParse(blankInvite).error?.issues.map((issue) => issue.path[0]) ?? [],
)

/**
 * Example only, not a backend integration: waits in memory and rejects
 * addresses at example.org to show a server-side field error. Nothing is sent.
 */
async function mockSendInvite(values: InviteValues): Promise<SubmitResult<InviteInput>> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  if (values.email.endsWith('@example.org')) {
    return {
      ok: false,
      message: 'The invitation was not sent.',
      fieldErrors: [{ name: 'email', message: 'example.org addresses can’t be invited.' }],
    }
  }
  return { ok: true, message: `Invitation sent to ${values.email}.` }
}

export function FormFieldDemo() {
  const form = useForm<InviteInput, unknown, InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: blankInvite,
  })
  const { submit, pending, feedback } = useFormSubmit(form, mockSendInvite)

  return (
    <div className="grid w-full max-w-sm gap-4">
      <Alert variant="info" role="none">
        <AlertTitle>Example only</AlertTitle>
        <AlertDescription>
          Mock submission; nothing is sent. Try an address ending in @example.org for a server
          error.
        </AlertDescription>
      </Alert>
      <form noValidate onSubmit={submit} aria-label="Invite a teammate" className="grid gap-4">
        <fieldset disabled={pending} className="grid min-w-0 gap-4">
          <FormField
            control={form.control}
            name="email"
            label="Teammate’s email"
            required={requiredFields.has('email')}
            render={({ field }) => (
              <FieldControl>
                <Input type="email" autoComplete="off" {...field} />
              </FieldControl>
            )}
          />
          <FormField
            control={form.control}
            name="admin"
            label="Make them an admin"
            orientation="horizontal"
            render={({ field }) => (
              <FieldControl>
                <Checkbox
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true)
                  }}
                  onBlur={field.onBlur}
                />
              </FieldControl>
            )}
          />
          <Button type="submit" loading={pending} className="justify-self-start">
            Send invite
          </Button>
        </fieldset>
        {feedback ? (
          <FormFeedback
            key={feedback.id}
            status={feedback.status}
            title={feedback.message}
            focusOnMount={feedback.focus}
          />
        ) : null}
      </form>
    </div>
  )
}
