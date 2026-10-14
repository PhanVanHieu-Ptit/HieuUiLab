import { render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { createRoutes } from '@/router/routes'

/**
 * Render the real route tree at `path` with an in-memory router, and wait
 * until its loaders and lazy page modules have resolved and the page is on screen.
 */
export async function renderRoute(path: string) {
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] })
  const view = render(<RouterProvider router={router} />)
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
