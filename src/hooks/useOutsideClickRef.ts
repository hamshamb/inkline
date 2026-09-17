import { useEffect, useRef } from 'react'

/** Like useOutsideClick, but creates and returns the ref for convenience at call sites that don't already have one. */
export function useOutsideClickRef<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    function handler(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [onOutside])
  return ref
}
