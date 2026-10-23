import { expect, test } from "vitest"
import { indexPlaces, normalize, selectPlaces } from "./places.js"
import { INSTITUTIONS } from "../data/institutions.js"

const index = indexPlaces(INSTITUTIONS)

test("normalize ignoriert Umlaute, ß und Großschreibung", () => {
  expect(normalize("Große Straße")).toBe("grosse strasse")
  expect(normalize("Lößniger")).toBe("lossniger")
})

test("filtert nach Kategorie und Text", () => {
  expect(selectPlaces(index, { category: "kita" }).map(item => item.id)).toEqual(["kita-regenbogen", "kita-suedvorstadt"])
  expect(selectPlaces(index, { text: "loessniger" })).toEqual([])
  expect(selectPlaces(index, { text: "lossniger" }).map(item => item.id)).toEqual(["kita-suedvorstadt"])
})

test("sortiert mit Startpunkt nach Entfernung", () => {
  const htwk = INSTITUTIONS.find(item => item.id === "htwk")
  const [first, second] = selectPlaces(index, { origin: htwk })
  expect(first.id).toBe("htwk")
  expect(first.distance).toBe(0)
  expect(second.distance).toBeGreaterThan(0)
})
