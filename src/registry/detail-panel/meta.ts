import detailPanelSource from '@/components/blocks/detail-panel.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { DetailPanelDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const detailPanelEntry: ImplementedEntry = {
  id: 'detail-panel',
  slug: 'detail-panel',
  name: 'Detail panel',
  description:
    'Details for the selected record: an inline aside beside the list on wide screens, a modal sheet on narrow ones, with focus managed in both.',
  kind: 'block',
  category: 'overlays',
  tags: ['a11y', 'focus-trap', 'keyboard', 'responsive'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/detail-panel.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['button', 'sheet'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: detailPanelSource,
  examples: [
    {
      id: 'tickets',
      title: 'List with details',
      description:
        'From a 64rem viewport the panel opens beside the list; below that it is a sheet. Resize the window while it is open to see it switch.',
      component: DetailPanelDemo,
      code: demoCode('DetailPanelDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
  guidelines: [
    'The panel is controlled: keep the open record’s id in state, and render the panel next to the list in a grid that gains a second column while it is open.',
    'Inline, it is non-modal: the list stays usable, focus moves to the panel heading on open, Escape closes it, and focus returns to the element that opened it (or the last one used outside the panel).',
    'As a sheet it is modal: focus is trapped, Escape and outside clicks close it, and focus returns to the opener.',
    'The switch point is a viewport media query (inlineQuery), not the container width. Pick one where the list and the panel both fit side by side.',
    'Open it from a button or link in the row, never from a click on the whole row.',
  ],
  api: {
    parts: [
      {
        name: 'DetailPanel',
        props: [
          { name: 'open', type: 'boolean', required: true, description: 'Whether it is shown.' },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            required: true,
            description: 'Called with false on close, Escape, or (as a sheet) an outside click.',
          },
          {
            name: 'title',
            type: 'ReactNode',
            required: true,
            description: 'Heading that names the panel.',
          },
          { name: 'description', type: 'ReactNode', description: 'Text under the title.' },
          {
            name: 'children',
            type: 'ReactNode',
            required: true,
            description: 'The details.',
          },
          {
            name: 'inlineQuery',
            type: 'string',
            default: "'(min-width: 64rem)'",
            description: 'Media query above which the panel is inline.',
          },
          { name: 'className', type: 'string', description: 'Classes for the inline aside.' },
        ],
      },
    ],
  },
}
