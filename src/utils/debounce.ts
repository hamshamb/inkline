/** A debounced function that also exposes `flush` and `cancel`. */
export interface Debounced<Args extends unknown[]> {
  (...args: Args): void
  flush: () => void
  cancel: () => void
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingArgs: Args | undefined

  const invoke = () => {
    if (pendingArgs) {
      const args = pendingArgs
      pendingArgs = undefined
      fn(...args)
    }
  }

  const debounced = ((...args: Args) => {
    pendingArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      invoke()
    }, waitMs)
  }) as Debounced<Args>

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    invoke()
  }

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    pendingArgs = undefined
  }

  return debounced
}
