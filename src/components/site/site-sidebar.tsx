import { docsNav } from '@/config/site'

import { DocsNavList } from './docs-nav'

export function SiteSidebar() {
  return (
    <nav aria-label="Registry">
      <DocsNavList sections={docsNav} />
    </nav>
  )
}
