import { createBrowserRouter } from 'react-router'
// The DOM entry point is the one that can commit a navigation synchronously (`flushSync`).
import { RouterProvider } from 'react-router/dom'

import { createRoutes } from './router/routes'

const router = createBrowserRouter(createRoutes())

export function App() {
  return <RouterProvider router={router} />
}
