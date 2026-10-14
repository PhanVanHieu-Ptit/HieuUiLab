import { createBrowserRouter, RouterProvider } from 'react-router'

import { createRoutes } from './router/routes'

const router = createBrowserRouter(createRoutes())

export function App() {
  return <RouterProvider router={router} />
}
