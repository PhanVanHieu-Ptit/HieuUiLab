import { useNavigation } from 'react-router'

import { Spinner } from '@/components/ui/spinner'

import { MainContent } from './main-content'

/** Shown in place of a layout while the first page's code loads. */
export function RouteFallback() {
  return (
    <MainContent className="flex flex-1 items-center justify-center py-section">
      <Spinner label="Loading page" />
    </MainContent>
  )
}

/** A thin bar at the top of the viewport while the next page loads. */
export function NavigationProgress() {
  const { state } = useNavigation()
  if (state === 'idle') return null
  return (
    <div
      aria-hidden="true"
      data-testid="navigation-progress"
      className="fixed inset-x-0 top-0 z-(--z-popover) h-0.5 animate-fade-in bg-primary [animation-delay:150ms] [animation-fill-mode:backwards]"
    />
  )
}
