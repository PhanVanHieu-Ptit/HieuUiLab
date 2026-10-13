import { Outlet } from 'react-router'

import { MainContent } from './main-content'

/** Full-width pages outside the docs (home, 404). */
export function PageLayout() {
  return (
    <MainContent className="flex-1">
      <Outlet />
    </MainContent>
  )
}
