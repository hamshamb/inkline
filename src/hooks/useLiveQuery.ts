import { useCallback, useRef, useSyncExternalStore } from 'react'
import { liveQuery } from 'dexie'

/**
 * Thin React binding over Dexie's built-in `liveQuery` observable — avoids
 * pulling in the separate `dexie-react-hooks` package for what is a small
 * amount of glue code around an API Dexie already ships.
 */
export function useLiveQuery<T>(querier: () => Promise<T>, deps: unknown[], initial: T): T {
  const valueRef = useRef<T>(initial)
  const listenersRef = useRef(new Set<() => void>())

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      listenersRef.current.add(onStoreChange)
      const subscription = liveQuery(querier).subscribe({
        next: (value) => {
          valueRef.current = value
          onStoreChange()
        },
        error: () => {
          // Keep the last good value on error rather than throwing during render.
        },
      })
      return () => {
        listenersRef.current.delete(onStoreChange)
        subscription.unsubscribe()
      }
    },
    // deps is intentionally a caller-provided dynamic array, mirroring
    // useEffect's dependency-list pattern for this generic data hook.
    deps,
  )

  const getSnapshot = useCallback(() => valueRef.current, [])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
