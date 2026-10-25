import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const kbdEntry: ImplementedEntry = {
  id: 'kbd',
  slug: 'kbd',
  name: 'Kbd',
  description: 'A semantic <kbd> element for keys and shortcut hints.',
  kind: 'component',
  category: 'data-display',
  tags: ['keyboard'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/kbd.tsx',
    packages: [],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  api: { parts: [{ name: 'Kbd', props: [nativeProps('kbd')] }] },
  content: () => import('./content'),
}
