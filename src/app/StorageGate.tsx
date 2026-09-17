import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { product } from '../config/product'

/**
 * IndexedDB is required — it's the only place documents live. Rather than
 * let every downstream call throw confusingly (or worse, silently pretend
 * to save), fail loudly and clearly up front. This happens in practice in
 * some locked-down private-browsing modes and very old browsers.
 */
function indexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

export function StorageGate({ children }: { children: ReactNode }) {
  if (indexedDbAvailable()) return children

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-[var(--color-bg)] px-6 text-center text-[var(--color-text)]">
      <TriangleAlert size={28} className="text-[var(--color-warning)]" aria-hidden />
      <p className="text-base font-semibold">{product.name} can't access local storage</p>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">
        This browser has IndexedDB disabled or unavailable (common in some private-browsing modes). {product.name} stores
        every document locally, so it cannot run without it. Try a normal browsing window, or a different browser.
      </p>
    </div>
  )
}
