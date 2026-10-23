import assert from "node:assert/strict"
import { test } from "vitest"
import { formatCount, formatDistance, formatDuration, formatNumber } from "./format.js"

test("formatDistance zeigt Meter ohne Dezimalstelle", () => {
  assert.equal(formatDistance(42), "42 m")
})

test("formatDistance zeigt Kilometer mit einer Dezimalstelle", () => {
  assert.equal(formatDistance(1234), "1,2 km")
})

test("formatDistance nutzt ein geschütztes Leerzeichen vor der Einheit", () => {
  assert.ok(formatDistance(500).includes(" "))
})

test("formatDistance liefert bei ungültiger Eingabe einen leeren String", () => {
  assert.equal(formatDistance(-5), "")
  assert.equal(formatDistance(Number.NaN), "")
})

test("formatNumber nutzt Intl.NumberFormat (de-DE Trennzeichen)", () => {
  assert.equal(formatNumber(1234.5, { maximumFractionDigits: 1 }), "1.234,5")
})

test("formatDuration rundet auf Minuten und trennt Stunden", () => {
  assert.equal(formatDuration(420), "7 Min.")
  assert.equal(formatDuration(3900), "1 Std. 5 Min.")
  assert.equal(formatDuration(10), "1 Min.")
})

test("formatCount bleibt zweistellig und gruppiert große Zahlen", () => {
  assert.equal(formatCount(7), "07")
  assert.equal(formatCount(1200), "1.200")
})
