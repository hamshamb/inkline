import { product } from '../config/product'
import type { ThemePreference } from './settingsSchema'

export type ResolvedTheme = 'light' | 'dark'

export const THEME_CACHE_KEY = `${product.storageNamespace}-theme-cache`

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return pref
}

/** Applies the resolved theme to the document root and caches it in localStorage for next load's inline pre-paint script. */
export function applyThemeToDom(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', resolved)
  try {
    localStorage.setItem(THEME_CACHE_KEY, resolved)
  } catch {
    // Best-effort only; a private-browsing quota error here is harmless.
  }
}
