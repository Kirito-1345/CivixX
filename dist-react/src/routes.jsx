import SiteLayout from "./components/SiteLayout.jsx"
import CivixApp from "./components/CivixApp.jsx"
import RouteError from "./components/RouteError.jsx"
import NotFound from "./pages/NotFound.jsx"
import Privacy from "./pages/Privacy.jsx"
import Cookies from "./pages/Cookies.jsx"
import Terms from "./pages/Terms.jsx"

// Äußere Grenze fängt Fehler im Rahmen, innere hält Header/Footer bei Seitenfehlern stehen.
export const routes = [{
  element: <SiteLayout />,
  errorElement: <RouteError standalone />,
  children: [{
    errorElement: <RouteError />,
    children: [
      { index: true, element: <CivixApp /> },
      { path: "datenschutz", element: <Privacy /> },
      { path: "cookies", element: <Cookies /> },
      { path: "nutzungsbedingungen", element: <Terms /> },
      { path: "*", element: <NotFound /> }
    ]
  }]
}]
