import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { routes } from "../routes.jsx"
import { geocodeCache, routeCache } from "../lib/services.js"

// Leaflet braucht echtes Layout; die Karte wird durch eine Attrappe mit derselben Schnittstelle ersetzt.
const mapProps = vi.hoisted(() => ({ current: null }))
vi.mock("./MapView.jsx", () => ({
  default: props => {
    mapProps.current = props
    return <div data-testid="map" data-markers={props.places.map(place => place.id).join(",")} />
  }
}))

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
const ROUTE = { code: "Ok", routes: [{ distance: 2100, duration: 420, geometry: { coordinates: [[12.4, 51.3], [12.37, 51.31]] } }] }

function renderApp(path = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const params = router => Object.fromEntries(new URLSearchParams(router.state.location.search))
const resultList = () => screen.getByRole("list", { name: "Einrichtungen" })
const resultNames = () => within(resultList()).queryAllByRole("link").map(link => within(link).getByText((_, el) => el.tagName === "STRONG").textContent)
const status = () => screen.getByRole("status")

beforeEach(() => {
  // Module-Caches überleben zwischen Tests; jeder Test fragt das Netz (Attrappe) neu.
  vi.spyOn(geocodeCache, "get").mockReturnValue(undefined)
  vi.spyOn(routeCache, "get").mockReturnValue(undefined)
})

describe("Suche", () => {
  test("Tippen filtert die Liste, ohne zu geocodieren", async () => {
    const fetch = vi.spyOn(globalThis, "fetch")
    renderApp()
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bibliothek" } })
    expect(resultNames()).toEqual(["Deutsche Nationalbibliothek", "Stadtbibliothek Leipzig"])
    expect((await screen.findByTestId("map")).dataset.markers).toBe("deutsche-nationalbibliothek,stadtbibliothek")
    expect(fetch).not.toHaveBeenCalled()
  })

  test("Absenden zeigt Ladezustand und schreibt die Suche in die URL", async () => {
    let resolve
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(done => { resolve = done }))
    const router = renderApp()
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Augustusplatz 10" } })
    const submit = screen.getByRole("button", { name: "Suchen" })
    expect(submit.disabled).toBe(false)
    fireEvent.click(submit)
    expect(screen.getByRole("button", { name: "Suche…" }).disabled).toBe(true)
    await act(async () => resolve(json([{ lat: "51.33853", lon: "12.37946", display_name: "Augustusplatz" }])))
    await waitFor(() => expect(params(router)).toEqual({ suche: "Augustusplatz 10", punkt: "51.33853,12.37946" }))
    expect(screen.getByRole("button", { name: "Suchen" }).disabled).toBe(false)
    expect(status().textContent).toContain("Adresse gefunden")
    expect(resultNames()).toHaveLength(11) // abgeschickter Text filtert nicht mehr
  })

  test("leere Suche erklärt, was einzugeben ist", () => {
    renderApp()
    fireEvent.click(screen.getByRole("button", { name: "Suchen" }))
    expect(status().textContent).toContain("Suchbegriff eingeben, z. B.")
    expect(document.activeElement).toBe(screen.getByRole("searchbox"))
  })

  test("Netzwerkfehler nennt nächsten Schritt und bietet Wiederholen", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(json([{ lat: "51.33853", lon: "12.37946", display_name: "Augustusplatz" }]))
    renderApp()
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Augustusplatz" } })
    fireEvent.click(screen.getByRole("button", { name: "Suchen" }))
    expect(await screen.findByText(/Dienst nicht erreichbar. Verbindung prüfen/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Erneut suchen" }))
    await waitFor(() => expect(status().textContent).toContain("Adresse gefunden"))
  })

  test("Deep-Link mit Suche ohne Punkt wird einmal aufgelöst", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(json([{ lat: "51.33853", lon: "12.37946", display_name: "Augustusplatz" }]))
    const router = renderApp("/?suche=Augustusplatz")
    await waitFor(() => expect(params(router).punkt).toBe("51.33853,12.37946"))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("searchbox").value).toBe("Augustusplatz")
  })
})

describe("Filter und URL", () => {
  test("Kategorie ist eine Radiogruppe und landet in der URL", () => {
    const router = renderApp()
    const group = screen.getByRole("group", { name: "Nach Kategorie filtern" })
    expect(within(group).getByRole("radio", { name: "Alle" }).checked).toBe(true)
    fireEvent.click(within(group).getByRole("radio", { name: "Kitas" }))
    expect(params(router)).toEqual({ kategorie: "kita" })
    expect(resultNames()).toEqual(["Kita Im Regenbogenland", "Kita Tillj"])
  })

  test("Deep-Link stellt Kategorie und Auswahl wieder her", () => {
    renderApp("/?kategorie=hochschule&ort=htwk")
    expect(screen.getByRole("radio", { name: "Hochschulen" }).checked).toBe(true)
    expect(screen.getByRole("heading", { level: 3, name: "HTWK Leipzig" })).toBeTruthy()
    expect(within(resultList()).getByRole("link", { current: true }).textContent).toContain("HTWK Leipzig")
    expect(document.title).toBe("HTWK Leipzig – CivixX")
  })

  test("ungültige Parameter werden still bereinigt", async () => {
    const router = renderApp("/?kategorie=zoo&ort=gibtsnicht&route=1&karte=1,2,3")
    await waitFor(() => expect(router.state.location.search).toBe(""))
    expect(screen.getByRole("radio", { name: "Alle" }).checked).toBe(true)
  })

  // Testing Library normalisiert geschützte Leerzeichen zu normalen; Formatierung prüft format.test.js.
  test("Auswahl ist ein Link; Zurück stellt den vorherigen Zustand her", async () => {
    const router = renderApp()
    fireEvent.click(within(resultList()).getByRole("link", { name: /HTWK Leipzig/ }))
    expect(params(router)).toEqual({ ort: "htwk" })
    await act(() => router.navigate(-1))
    expect(params(router)).toEqual({})
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull()
  })

  test("Marker auf der Karte wählen dieselbe Einrichtung wie die Liste", async () => {
    const router = renderApp()
    await screen.findByTestId("map")
    act(() => mapProps.current.onSelect(mapProps.current.places.find(place => place.id === "hmt")))
    expect(params(router)).toEqual({ ort: "hmt" })
  })
})

describe("Favoriten", () => {
  test("Entfernen lässt sich rückgängig machen", () => {
    renderApp("/?ort=htwk")
    fireEvent.click(screen.getByRole("button", { name: "Merken" }))
    const saved = () => within(screen.getByRole("list", { name: "Favoriten" })).queryAllByRole("link")
    expect(saved()).toHaveLength(1)
    fireEvent.click(screen.getByRole("button", { name: "Entfernen aus Favoriten" }))
    expect(saved()).toHaveLength(0)
    fireEvent.click(screen.getByRole("button", { name: "Rückgängig" }))
    expect(saved()).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem("civixx.favorites"))).toEqual({ v: 3, data: ["htwk"] })
  })

  test("unlesbarer Speicher: Hinweis, Sicherung, kein stilles Überschreiben", () => {
    localStorage.setItem("civixx.favorites", "{kaputt")
    renderApp()
    expect(screen.getByText(/Gespeicherte Favoriten waren unlesbar/)).toBeTruthy()
    expect(localStorage.getItem("civixx.favorites")).toBe("{kaputt")
    expect(localStorage.getItem("civixx.favorites.backup")).toBe("{kaputt")
  })
})

describe("Route", () => {
  test("ohne Startpunkt: konkreter Hinweis statt Anfrage", () => {
    const fetch = vi.spyOn(globalThis, "fetch")
    renderApp("/?ort=htwk")
    fireEvent.click(screen.getByRole("button", { name: "Route hierher" }))
    expect(status().textContent).toContain("Erst Startpunkt festlegen")
    expect(fetch).not.toHaveBeenCalled()
  })

  test("Fehler mit Wiederholen, danach Erfolg mit Entfernung und Dauer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({}, 503)).mockResolvedValueOnce(json(ROUTE))
    const router = renderApp("/?ort=htwk&start=51.3,12.4")
    fireEvent.click(screen.getByRole("button", { name: "Route hierher" }))
    expect(params(router).route).toBe("1")
    expect(screen.getByRole("button", { name: "Route…" }).disabled).toBe(true)
    expect(await screen.findByText(/Der Dienst antwortet gerade nicht/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }))
    expect(await screen.findByText("Route erstellt: 2,1 km · ca. 7 Min.")).toBeTruthy()
    expect(mapProps.current.route.positions).toEqual([[51.3, 12.4], [51.31, 12.37]])
  })

  test("Reload mit route=1 berechnet die Route erneut", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(ROUTE))
    renderApp("/?ort=htwk&start=51.3,12.4&route=1")
    expect(await screen.findByText(/Route ab Kartenpunkt: 2,1 km/)).toBeTruthy()
  })

  test("Startpunkt per Tastatur über die Kartenmitte", async () => {
    const router = renderApp()
    fireEvent.click(screen.getByRole("button", { name: "Kartenmitte als Start" }))
    expect(params(router).start).toBe("51.3397,12.3731")
    fireEvent.click(screen.getByRole("button", { name: "Startpunkt entfernen" }))
    expect(params(router).start).toBeUndefined()
  })
})

describe("Rahmen", () => {
  test("Skip-Link führt zum Hauptinhalt", () => {
    renderApp()
    fireEvent.click(screen.getByRole("link", { name: "Zum Inhalt springen" }))
    expect(document.activeElement).toBe(screen.getByRole("main"))
  })

  test("unbekannte Seite zeigt 404 im Rahmen", () => {
    renderApp("/gibtsnicht")
    expect(screen.getByRole("heading", { level: 1, name: "Seite nicht gefunden" })).toBeTruthy()
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeTruthy()
  })
})
