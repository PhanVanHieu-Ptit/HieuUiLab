import { useState } from 'react'

import { SignInPage } from '@/components/blocks/sign-in-page'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import { mockSignIn, signInOutcomes, type SignInOutcome } from './mock-data'

export function SignInPageDemo() {
  return (
    <SignInPage
      onSubmit={(values) => mockSignIn(values, 'success')}
      forgotPasswordHref="#forgot-password"
      createAccountHref="#create-account"
    />
  )
}

export function SignInPageOutcomesDemo() {
  const [outcome, setOutcome] = useState<SignInOutcome>('wrong-password')
  const [ssoClicks, setSsoClicks] = useState(0)

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>
        Nothing is checked or sent. Type anything, then pick what the mock service answers.
      </ExampleOnlyNotice>
      <MockPicker options={signInOutcomes} value={outcome} onChange={setOutcome} />
      <SignInPage
        onSubmit={(values) => mockSignIn(values, outcome)}
        onSsoClick={() => {
          setSsoClicks((count) => count + 1)
        }}
        forgotPasswordHref="#forgot-password"
        createAccountHref="#create-account"
      />
      <p role="status" className="text-sm text-muted-foreground">
        {ssoClicks === 0
          ? 'Single sign-on button not pressed yet.'
          : `Single sign-on pressed ${String(ssoClicks)} time${ssoClicks === 1 ? '' : 's'} (example only).`}
      </p>
    </div>
  )
}

export function SignInPageAsideDemo() {
  return (
    <SignInPage
      title="Welcome back"
      description="Sign in to pick up where you left off."
      brand={<span className="text-sm font-semibold tracking-tight">Example Studio</span>}
      defaultEmail="alex@example.com"
      onSubmit={(values) => mockSignIn(values, 'success')}
      aside={
        <figure className="max-w-xs">
          <blockquote className="text-lg font-medium text-pretty">
            “Invented testimonial: the side panel is for any decorative content you choose.”
          </blockquote>
          <figcaption className="mt-3 text-sm opacity-80">
            Example person, Example Studio
          </figcaption>
        </figure>
      }
    />
  )
}
