import { useCallback, useEffect, useState } from "react"

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Der lokale Speicher kann deaktiviert sein.
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initialValue), [initialValue])
  return [value, setValue, reset]
}
