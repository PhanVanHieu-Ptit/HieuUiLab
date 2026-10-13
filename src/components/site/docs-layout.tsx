import { Outlet } from 'react-router'

import { SiteSidebar } from './site-sidebar'

export function DocsLayout() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="md:sticky md:top-22 md:self-start">
        <SiteSidebar />
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 outline-none">
        <Outlet />
      </main>
    </div>
  )
}
