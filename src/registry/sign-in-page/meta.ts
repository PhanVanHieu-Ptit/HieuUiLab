import signInPageSource from '@/components/blocks/sign-in-page.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { SignInPageAsideDemo, SignInPageDemo, SignInPageOutcomesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const signInPageEntry: ImplementedEntry = {
  id: 'sign-in-page',
  slug: 'sign-in-page',
  name: 'Sign-in page',
  description:
    'A sign-in screen UI with validation, a show/hide password toggle, optional single sign-on and account links, and a pending, success, and failure state. It never authenticates.',
  kind: 'block',
  category: 'pages',
  tags: ['a11y', 'async', 'auth', 'form', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/sign-in-page.tsx',
    packages: ['react-hook-form', 'zod', '@hookform/resolvers'],
    registryDependencies: [
      'button',
      'card',
      'checkbox',
      'field',
      'form',
      'form-feedback',
      'input',
      'password-input',
      'separator',
    ],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
    notes: [
      'This is the screen only. Authentication, sessions, rate limiting, and cookies belong to your backend or identity provider: connect them in onSubmit and onSsoClick.',
      'The links are plain anchors that take an href, so they work with any router: wrap or replace them if you want client-side navigation.',
    ],
  },
  source: signInPageSource,
  examples: [
    {
      id: 'sign-in',
      title: 'Email and password',
      description:
        'Example only: the mock handler accepts anything and creates no session. Nothing is sent.',
      component: SignInPageDemo,
      code: demoCode('SignInPageDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'outcomes',
      title: 'Outcomes and single sign-on',
      description:
        'Example only: pick what the mock service answers to see the wrong-password, locked, and unavailable states.',
      component: SignInPageOutcomesDemo,
      code: demoCode('SignInPageOutcomesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'aside',
      title: 'With a side panel',
      description:
        'Example content, invented for this page. The panel appears beside the form when the block is wide enough.',
      component: SignInPageAsideDemo,
      code: demoCode('SignInPageAsideDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
  guidelines: [
    'This block is a UI only. It validates that the fields are filled in and hands the values to onSubmit; it never checks a password, stores a session, or talks to a server.',
    'Do not reveal which half of the credentials was wrong: return one message for both, as the “wrong password” example does.',
    'The email field uses autocomplete="username" and the password field autocomplete="current-password" so password managers can fill them. Nothing is focused on load.',
    'While signing in, every control is disabled and the button reports busy. The outcome is announced as a status or an alert and focused, so keyboard users land next to it.',
    'Errors appear after the first submit and update as the user types. An invalid submit focuses the first invalid field.',
    'The block fills its container instead of the window, so it fits a full page, a modal, or a framed preview. The side panel needs 52rem of width; below that it is hidden, so keep it decorative.',
  ],
  api: {
    parts: [
      {
        name: 'SignInPage',
        props: [
          {
            name: 'onSubmit',
            type: '(values: SignInValues) => Promise<SubmitResult<SignInInput>>',
            required: true,
            description:
              'Signs the user in and reports the outcome. Return field errors or a message; a rejected promise shows a generic error.',
          },
          {
            name: 'onSsoClick',
            type: '() => void',
            description: 'Shows the single sign-on button when given.',
          },
          {
            name: 'ssoLabel',
            type: 'string',
            default: "'Continue with single sign-on'",
            description: 'Text of the single sign-on button.',
          },
          {
            name: 'forgotPasswordHref',
            type: 'string',
            description: 'Shows a “Forgot password?” link when given.',
          },
          {
            name: 'createAccountHref',
            type: 'string',
            description: 'Shows a “Create an account” link when given.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'Sign in'",
            description: 'Heading of the form.',
          },
          {
            name: 'description',
            type: 'string',
            default: "'Enter your email and password to continue.'",
            description: 'Text under the heading.',
          },
          {
            name: 'brand',
            type: 'ReactNode',
            description: 'A logo or product name above the title.',
          },
          {
            name: 'aside',
            type: 'ReactNode',
            description: 'A decorative second column from 52rem wide; hidden when narrower.',
          },
          {
            name: 'defaultEmail',
            type: 'string',
            default: "''",
            description: 'Email to start with.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Show the form but block editing and submitting.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'signInSchema',
        description: 'The Zod schema behind the form; exported for server-side reuse and tests.',
        props: [
          {
            name: 'email',
            type: 'string',
            required: true,
            description: 'Trimmed; must be an email address.',
          },
          {
            name: 'password',
            type: 'string',
            required: true,
            description: 'Must not be empty. No strength rules: those belong to sign-up.',
          },
          { name: 'remember', type: 'boolean', required: true, description: 'Remember-me choice.' },
        ],
      },
      {
        name: 'SignInInput / SignInValues',
        description: 'What the inputs hold while editing, and what a valid submission delivers.',
        props: [
          {
            name: 'SignInInput',
            type: 'z.input<typeof signInSchema>',
            description: 'Untrimmed values as typed.',
          },
          {
            name: 'SignInValues',
            type: 'z.output<typeof signInSchema>',
            description: 'Values passed to onSubmit, with the email trimmed.',
          },
        ],
      },
    ],
  },
}
