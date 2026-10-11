import assert from "node:assert/strict"
import test from "node:test"
import { byDistanceThenName, distance } from "./geo.js"

test("distance: Augustusplatz → Hauptbahnhof ist rund 700 m", () => {
  const km = distance({ lat: 51.33853, lng: 12.37946 }, { lat: 51.3455, lng: 12.3821 })
  assert.ok(km > 0.6 && km < 0.9, `${km} km`)
})

test("sortiert nach Entfernung, 0 km zuerst", () => {
  const sorted = [{ name: "B", distance: 2 }, { name: "Z", distance: 0 }, { name: "A", distance: 1 }].sort(byDistanceThenName)
  assert.deepEqual(sorted.map(item => item.name), ["Z", "A", "B"])
})

test("ohne Entfernung alphabetisch", () => {
  const sorted = [{ name: "Öl" }, { name: "Zoo" }, { name: "Amt" }].sort(byDistanceThenName)
  assert.deepEqual(sorted.map(item => item.name), ["Amt", "Öl", "Zoo"])
})
