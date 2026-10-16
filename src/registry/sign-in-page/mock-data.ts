import type { SignInInput, SignInValues } from '@/components/blocks/sign-in-page'
import type { SubmitResult } from '@/components/ui/form'

import { mockDelay } from '../mock-delay'

export type SignInOutcome = 'success' | 'wrong-password' | 'locked' | 'unavailable'

export const signInOutcomes: readonly { value: SignInOutcome; label: string }[] = [
  { value: 'success', label: 'Signs in' },
  { value: 'wrong-password', label: 'Wrong password' },
  { value: 'locked', label: 'Account locked' },
  { value: 'unavailable', label: 'Service unavailable' },
]

/**
 * Example only, not authentication. Nothing is checked, sent, or stored, and no session is
 * created: the result is whatever outcome the demo picked, whatever was typed.
 */
export async function mockSignIn(
  values: SignInValues,
  outcome: SignInOutcome,
): Promise<SubmitResult<SignInInput>> {
  await mockDelay(600)
  if (outcome === 'unavailable') throw new Error('Mock: the sign-in service is unavailable.')
  if (outcome === 'wrong-password') {
    return {
      ok: false,
      message: 'Check your details and try again.',
      fieldErrors: [{ name: 'password', message: 'That email and password don’t match.' }],
    }
  }
  if (outcome === 'locked') {
    return {
      ok: false,
      message:
        'This account is temporarily locked. Try again in 15 minutes or reset your password.',
    }
  }
  return {
    ok: true,
    message: `Signed in as ${values.email}. This is an example: no session was created.`,
  }
}
