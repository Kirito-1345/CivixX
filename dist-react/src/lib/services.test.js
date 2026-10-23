import { afterEach, describe, expect, test, vi } from "vitest"
import { createCache } from "./cache.js"
import { fetchRoute, geocode } from "./services.js"

const respond = (body, init = {}) => vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status: 200, ...init }))
const freshCache = () => createCache({ key: "t", ttl: 1000, max: 10 })

afterEach(() => vi.restoreAllMocks())

describe("geocode", () => {
  test("liefert gerundeten Punkt und nutzt danach den Cache", async () => {
    const fetch = respond([{ lat: "51.3385312", lon: "12.3794611", display_name: "Augustusplatz" }])
    const cache = freshCache()
    expect(await geocode("Augustusplatz", { cache })).toEqual({ lat: 51.33853, lng: 12.37946, label: "Augustusplatz" })
    expect(await geocode(" augustusplatz ", { cache })).toEqual({ lat: 51.33853, lng: 12.37946, label: "Augustusplatz" })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test("Treffer außerhalb Leipzigs gelten als nicht gefunden", async () => {
    respond([{ lat: "48.1", lon: "11.5", display_name: "München" }])
    expect(await geocode("Marienplatz", { cache: freshCache() })).toBeNull()
  })

  test("unterscheidet Fehlerarten", async () => {
    respond({}, { status: 429 })
    await expect(geocode("a", { cache: freshCache() })).rejects.toMatchObject({ kind: "rate-limit" })
    vi.restoreAllMocks()
    respond({}, { status: 503 })
    await expect(geocode("b", { cache: freshCache() })).rejects.toMatchObject({ kind: "server" })
    vi.restoreAllMocks()
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"))
    await expect(geocode("c", { cache: freshCache() })).rejects.toMatchObject({ kind: "network" })
  })

  test("reicht Abbrüche unverändert durch", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("abgebrochen", "AbortError"))
    await expect(geocode("d", { cache: freshCache() })).rejects.toMatchObject({ name: "AbortError" })
  })
})

describe("fetchRoute", () => {
  const start = { lat: 51.3, lng: 12.4 }
  const destination = { lat: 51.31, lng: 12.37 }

  test("dreht GeoJSON-Koordinaten in lat,lng", async () => {
    respond({ code: "Ok", routes: [{ distance: 2100, duration: 360, geometry: { coordinates: [[12.4, 51.3], [12.37, 51.31]] } }] })
    expect(await fetchRoute(start, destination, { cache: freshCache() })).toEqual({ positions: [[51.3, 12.4], [51.31, 12.37]], distance: 2100, duration: 360 })
  })

  test("meldet fehlende Route", async () => {
    respond({ code: "NoRoute", routes: [] })
    await expect(fetchRoute(start, destination, { cache: freshCache() })).rejects.toMatchObject({ kind: "no-route" })
  })
})
