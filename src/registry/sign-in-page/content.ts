import signInPageSource from '@/components/blocks/sign-in-page.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SignInPageAsideDemo, SignInPageDemo, SignInPageOutcomesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
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
}
