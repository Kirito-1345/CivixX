import assert from "node:assert/strict"
import { test } from "node:test"
import { readStored } from "./useLocalStorage.js"

const stored = value => { globalThis.localStorage = { getItem: () => value } }

test("readStored liefert bei kaputten Daten den Standardwert", () => {
  for (const bad of ["null", "{}", "\"text\"", "{kaputt"]) {
    stored(bad)
    assert.deepEqual(readStored("k", []), [])
  }
  stored(null)
  assert.deepEqual(readStored("k", []), [])
  stored('[{"id":"a"}]')
  assert.deepEqual(readStored("k", []), [{ id: "a" }])
})
