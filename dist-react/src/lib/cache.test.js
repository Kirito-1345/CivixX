import { describe, expect, test } from "vitest"
import { createCache } from "./cache.js"

const memory = (entries = {}) => {
  const data = new Map(Object.entries(entries))
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), data }
}

const clock = () => {
  let time = 1000
  return { now: () => time, advance: ms => { time += ms } }
}

describe("createCache", () => {
  test("liefert gespeicherte Werte und persistiert sie", () => {
    const storage = memory()
    const cache = createCache({ storage, key: "c", ttl: 100, max: 5 })
    cache.set("a", 1)
    expect(cache.get("a")).toBe(1)
    expect(createCache({ storage, key: "c", ttl: 100, max: 5 }).get("a")).toBe(1)
  })

  test("verwirft abgelaufene Einträge", () => {
    const time = clock()
    const cache = createCache({ key: "c", ttl: 100, max: 5, now: time.now })
    cache.set("a", 1)
    time.advance(101)
    expect(cache.get("a")).toBeUndefined()
    expect(cache.size).toBe(0)
  })

  test("hält die Obergrenze ein und entfernt den am längsten ungenutzten Eintrag", () => {
    const cache = createCache({ key: "c", ttl: 100, max: 2 })
    cache.set("a", 1)
    cache.set("b", 2)
    cache.get("a")
    cache.set("c", 3)
    expect(cache.get("b")).toBeUndefined()
    expect(cache.get("a")).toBe(1)
    expect(cache.size).toBe(2)
  })

  test("übersteht kaputte und ungültige Speicherdaten", () => {
    expect(createCache({ storage: memory({ c: "{" }), key: "c", ttl: 100, max: 5 }).size).toBe(0)
    const stored = JSON.stringify({ v: 1, data: [["a", { value: "x", expires: Date.now() + 1000 }], ["b", { value: 2, expires: Date.now() + 1000 }]] })
    const cache = createCache({ storage: memory({ c: stored }), key: "c", ttl: 100, max: 5, validate: value => typeof value === "number" })
    expect(cache.get("a")).toBeUndefined()
    expect(cache.get("b")).toBe(2)
  })

  test("opfert bei vollem Speicher ältere Einträge", () => {
    const storage = memory()
    storage.setItem = (key, value) => {
      if (JSON.parse(value).data.length > 2) throw new DOMException("voll", "QuotaExceededError")
      storage.data.set(key, value)
    }
    const cache = createCache({ storage, key: "c", ttl: 100, max: 10 })
    for (const key of ["a", "b", "c", "d"]) cache.set(key, key)
    expect(JSON.parse(storage.data.get("c")).data.map(([key]) => key)).toEqual(["c", "d"])
  })
})
