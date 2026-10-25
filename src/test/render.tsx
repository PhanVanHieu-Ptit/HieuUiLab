import { act, render, waitFor, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { createRoutes } from '@/router/routes'

/**
 * `render`, inside an awaited `act`. A component that suspends while the first render is committing
 * (a card's example loading its chunk) is only retried once the act scope has been awaited; with
 * the synchronous `render` it stays on its fallback for good.
 */
export async function renderSettled(ui: ReactElement): Promise<RenderResult> {
  let view!: RenderResult
  await act(() => {
    view = render(ui)
    return Promise.resolve()
  })
  return view
}

/**
 * Render the real route tree at `path` with an in-memory router, and wait
 * until its loaders and lazy page modules have resolved and the page is on screen.
 */
export async function renderRoute(path: string) {
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] })
  const view = await renderSettled(<RouterProvider router={router} />)
  await waitFor(
    () => {
      const { initialized, navigation } = router.state
      // React Router commits state in a transition, so also wait for the DOM.
      const rendered =
        view.container.querySelector('main') !== null &&
        !view.container.textContent.includes('Loading page')
      if (!initialized || navigation.state !== 'idle' || !rendered) {
        throw new Error(`Still loading ${path}`)
      }
    },
    { timeout: 5000 },
  )
  return { router, ...view }
}
