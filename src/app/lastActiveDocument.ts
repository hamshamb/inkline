import { product } from '../config/product'

/**
 * Remembers which document was open, purely as a local UI convenience so
 * reloading the tab (or reopening the PWA) resumes where you left off. This
 * is not document content — just an id — so it's fine to keep in
 * localStorage alongside the theme cache rather than in IndexedDB.
 */
const KEY = `${product.storageNamespace}-last-active-document`

export function getLastActiveDocumentId(): string | undefined {
  try {
    return localStorage.getItem(KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function setLastActiveDocumentId(id: string | undefined): void {
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch {
    // Best-effort only.
  }
}
