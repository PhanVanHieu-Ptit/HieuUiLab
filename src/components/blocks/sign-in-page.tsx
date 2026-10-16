import { zodResolver } from '@hookform/resolvers/zod'
import { useId, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldControl } from '@/components/ui/field'
import { FormField, useFormSubmit, type SubmitResult } from '@/components/ui/form'
import { FormFeedback } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'

/**
 * What the sign-in form checks before it calls `onSubmit`. Sign-in only asks for a password, not
 * for a strong one: rules about strength belong where a password is chosen.
 */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter an email address like name@example.com.')),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean(),
})

/** What the inputs hold while editing. */
export type SignInInput = z.input<typeof signInSchema>
/** What a valid submission delivers: the email trimmed. */
export type SignInValues = z.output<typeof signInSchema>

export interface SignInPageProps {
  /**
   * Signs the user in and reports the outcome. This block never authenticates: it hands you the
   * values. Return field errors (for example for the password) or a message; a rejected promise
   * shows a generic error.
   */
  onSubmit: (values: SignInValues) => Promise<SubmitResult<SignInInput>>
  /** Shows the single sign-on button when given. */
  onSsoClick?: () => void
  ssoLabel?: string
  /** Shows a “Forgot password?” link when given. */
  forgotPasswordHref?: string
  /** Shows a “Create an account” link when given. */
  createAccountHref?: string
  title?: string
  description?: string
  /** A logo or product name above the title. */
  brand?: ReactNode
  /** A second column beside the form from 52rem wide; hidden when narrower. Keep it decorative. */
  aside?: ReactNode
  /** Email to start with, for example one remembered by your app. */
  defaultEmail?: string
  /** Show the form but block editing and submitting. */
  disabled?: boolean
  className?: string
}

/**
 * A sign-in screen on React Hook Form and Zod: email, password with a show/hide toggle, and a
 * remember-me choice, with optional single sign-on, “forgot password” and “create account” links.
 * It fills its container, so it works full-bleed or inside a frame. While signing in, every
 * control is disabled and the outcome is announced and focused when it settles.
 */
export function SignInPage({
  onSubmit,
  onSsoClick,
  ssoLabel = 'Continue with single sign-on',
  forgotPasswordHref,
  createAccountHref,
  title = 'Sign in',
  description = 'Enter your email and password to continue.',
  brand,
  aside,
  defaultEmail = '',
  disabled = false,
  className,
}: SignInPageProps) {
  const headingId = useId()
  const form = useForm<SignInInput, unknown, SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: defaultEmail, password: '', remember: false },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { control } = form
  const { submit, pending, feedback } = useFormSubmit(form, onSubmit, {
    successMessage: 'You are signed in.',
    failureMessage: 'We couldn’t sign you in right now. Try again in a moment.',
  })
  const linkClass =
    'rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-ring'

  return (
    <section aria-labelledby={headingId} className={cn('@container w-full min-w-0', className)}>
      <div
        className={cn(
          'grid min-h-[28rem] w-full overflow-hidden rounded-lg border bg-muted/50 text-surface-foreground',
          // Two columns only when there is a side panel; otherwise the form stays centered.
          aside ? '@[52rem]:grid-cols-2' : undefined,
        )}
      >
        <div className="flex items-center justify-center p-4 @lg:p-8">
          <Card className="w-full max-w-sm shadow-raised">
            <CardHeader>
              {brand ? <div className="mb-2">{brand}</div> : null}
              <CardTitle as="h2" id={headingId} className="text-xl">
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <form noValidate onSubmit={submit} aria-labelledby={headingId} className="grid gap-5">
                <fieldset disabled={disabled || pending} className="grid min-w-0 gap-4">
                  <FormField
                    control={control}
                    name="email"
                    label="Email"
                    required
                    render={({ field }) => (
                      <FieldControl>
                        <Input
                          type="email"
                          autoComplete="username"
                          spellCheck={false}
                          autoCapitalize="none"
                          {...field}
                        />
                      </FieldControl>
                    )}
                  />
                  <FormField
                    control={control}
                    name="password"
                    label="Password"
                    required
                    render={({ field }) => (
                      <FieldControl>
                        <PasswordInput autoComplete="current-password" {...field} />
                      </FieldControl>
                    )}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <FormField
                      control={control}
                      name="remember"
                      label="Remember me"
                      orientation="horizontal"
                      render={({ field }) => (
                        <FieldControl>
                          <Checkbox
                            ref={field.ref}
                            name={field.name}
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true)
                            }}
                            onBlur={field.onBlur}
                          />
                        </FieldControl>
                      )}
                    />
                    {forgotPasswordHref ? (
                      <a href={forgotPasswordHref} className={linkClass}>
                        Forgot password?
                      </a>
                    ) : null}
                  </div>
                  <Button type="submit" loading={pending} className="w-full">
                    {pending ? 'Signing in…' : 'Sign in'}
                  </Button>
                </fieldset>
                {feedback ? (
                  <FormFeedback
                    key={feedback.id}
                    status={feedback.status}
                    title={feedback.status === 'success' ? 'Signed in' : 'Couldn’t sign in'}
                    focusOnMount={feedback.focus}
                  >
                    {feedback.message}
                  </FormFeedback>
                ) : null}
              </form>
              {onSsoClick ? (
                <>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Separator className="flex-1" />
                    or
                    <Separator className="flex-1" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={disabled || pending}
                    onClick={onSsoClick}
                  >
                    {ssoLabel}
                  </Button>
                </>
              ) : null}
              {createAccountHref ? (
                <p className="text-center text-sm text-muted-foreground">
                  New here?{' '}
                  <a href={createAccountHref} className={linkClass}>
                    Create an account
                  </a>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
        {aside ? (
          <div className="hidden items-center justify-center border-l bg-primary-subtle p-8 text-primary-subtle-foreground @[52rem]:flex">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  )
}
