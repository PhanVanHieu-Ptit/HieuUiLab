import { Outlet } from 'react-router'

import { SiteHeader } from './site-header'

export function SiteLayout() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <Outlet />
    </div>
  )
}
