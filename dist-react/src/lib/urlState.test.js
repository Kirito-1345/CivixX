import { describe, expect, test } from "vitest"
import { parseUrlState, serializeUrlState } from "./urlState.js"

const context = { categories: ["schule", "kita"], placeIds: new Set(["htwk", "hmt"]) }
const parse = query => parseUrlState(new URLSearchParams(query), context)

describe("parseUrlState", () => {
  test("liest gültige Parameter", () => {
    expect(parse("kategorie=schule&ort=htwk&suche=Markt&punkt=51.34,12.37&start=51.3,12.4&route=1&karte=51.33,12.37,14")).toEqual({
      category: "schule",
      placeId: "htwk",
      search: { query: "Markt", position: { lat: 51.34, lng: 12.37 } },
      start: { lat: 51.3, lng: 12.4 },
      route: true,
      view: { lat: 51.33, lng: 12.37, zoom: 14 }
    })
  })

  test("verwirft unbekannte Kategorien, IDs und Punkte außerhalb Leipzigs", () => {
    expect(parse("kategorie=zoo&ort=gibtsnicht&start=48.1,11.5&karte=51.3,12.3,99&punkt=x")).toEqual({
      category: "alle", placeId: null, search: null, start: null, route: false, view: null
    })
  })

  test("Route nur mit gültigem Ziel", () => {
    expect(parse("route=1&start=51.3,12.4").route).toBe(false)
  })

  test("Suche ohne Punkt bleibt als offene Suche erhalten und wird gekürzt", () => {
    const state = parse(`suche=${"a".repeat(300)}`)
    expect(state.search).toEqual({ query: "a".repeat(200), position: null })
  })
})

describe("serializeUrlState", () => {
  test("lässt Standardwerte weg", () => {
    expect(serializeUrlState(parse("")).toString()).toBe("")
  })

  test("ist idempotent und in fester Reihenfolge", () => {
    const query = "karte=51.33,12.37,14&route=1&ort=htwk&kategorie=kita&start=51.300001,12.4"
    const once = serializeUrlState(parse(query)).toString()
    expect(once).toBe("kategorie=kita&ort=htwk&start=51.3%2C12.4&route=1&karte=51.33%2C12.37%2C14")
    expect(serializeUrlState(parse(once)).toString()).toBe(once)
  })
})
