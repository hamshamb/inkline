import { useEffect, type RefObject } from 'react'

export function useOutsideClick(ref: RefObject<HTMLElement | null>, onOutside: () => void): void {
  useEffect(() => {
    function handler(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [ref, onOutside])
}
