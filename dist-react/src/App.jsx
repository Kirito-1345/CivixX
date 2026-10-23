import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes.jsx"

// Data Router: nötig für ScrollRestoration und errorElement.
const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
