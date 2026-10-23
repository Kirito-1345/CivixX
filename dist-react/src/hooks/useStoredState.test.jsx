import { act, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"
import { useStoredState } from "./useStoredState.js"
import { FAVORITES } from "../data/favorites.js"

const envelope = data => JSON.stringify({ v: 3, data })
const crossTab = (key, newValue) => act(() => {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: localStorage }))
})

test("schreibt beim Laden nichts und sichert unlesbare Daten", () => {
  localStorage.setItem(FAVORITES.key, "kaputt")
  const { result } = renderHook(() => useStoredState(FAVORITES))
  expect(result.current[0]).toEqual([])
  expect(result.current[2]).toBe("corrupt")
  expect(localStorage.getItem(FAVORITES.key)).toBe("kaputt")
  expect(localStorage.getItem(`${FAVORITES.key}.backup`)).toBe("kaputt")
})

test("speichert erst nach eigener Änderung", () => {
  const { result } = renderHook(() => useStoredState(FAVORITES))
  expect(localStorage.getItem(FAVORITES.key)).toBeNull()
  act(() => result.current[1](["htwk"]))
  expect(localStorage.getItem(FAVORITES.key)).toBe(envelope(["htwk"]))
})

test("schließt Migration ab und entfernt den alten Schlüssel", () => {
  localStorage.setItem("civixx.savedPlaces.v2", JSON.stringify([{ id: "htwk" }]))
  const { result } = renderHook(() => useStoredState(FAVORITES))
  expect(result.current[0]).toEqual(["htwk"])
  expect(localStorage.getItem(FAVORITES.key)).toBe(envelope(["htwk"]))
  expect(localStorage.getItem("civixx.savedPlaces.v2")).toBeNull()
})

test("überschreibt Daten einer neueren Version nie", () => {
  const newer = JSON.stringify({ v: 9, data: { anders: true } })
  localStorage.setItem(FAVORITES.key, newer)
  const { result } = renderHook(() => useStoredState(FAVORITES))
  expect(result.current[2]).toBe("newer")
  act(() => result.current[1](["htwk"]))
  expect(result.current[0]).toEqual(["htwk"])
  expect(localStorage.getItem(FAVORITES.key)).toBe(newer)
})

test("übernimmt gültige Änderungen anderer Tabs und ignoriert ungültige", () => {
  const { result } = renderHook(() => useStoredState(FAVORITES))
  crossTab(FAVORITES.key, envelope(["hmt"]))
  expect(result.current[0]).toEqual(["hmt"])

  localStorage.setItem(FAVORITES.key, "{kaputt")
  crossTab(FAVORITES.key, "{kaputt")
  expect(result.current[0]).toEqual(["hmt"])
  expect(localStorage.getItem(FAVORITES.key)).toBe("{kaputt") // nicht zurückgeschrieben

  crossTab(null, null) // localStorage.clear() in anderem Tab
  expect(result.current[0]).toEqual([])
})
