export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  const platform = navigator.platform || navigator.userAgent
  return /Mac|iPhone|iPad|iPod/.test(platform)
}

/** The modifier key label for the current platform ("⌘" on Mac, "Ctrl" elsewhere). */
export function modKeyLabel(): string {
  return isMac() ? '⌘' : 'Ctrl'
}

export interface ShortcutSpec {
  key: string
  mod?: boolean
  shift?: boolean
  alt?: boolean
}

/** Formats a shortcut spec for display, e.g. { key: 's', mod: true } -> "Ctrl+S". */
export function formatShortcut(spec: ShortcutSpec): string {
  const parts: string[] = []
  const mac = isMac()
  if (spec.mod) parts.push(mac ? '⌘' : 'Ctrl')
  if (spec.alt) parts.push(mac ? '⌥' : 'Alt')
  if (spec.shift) parts.push(mac ? '⇧' : 'Shift')
  parts.push(spec.key.length === 1 ? spec.key.toUpperCase() : spec.key)
  return parts.join(mac ? '' : '+')
}

/** Checks whether a KeyboardEvent matches a shortcut spec, using the platform's modifier key. */
export function matchesShortcut(e: KeyboardEvent, spec: ShortcutSpec): boolean {
  const modPressed = isMac() ? e.metaKey : e.ctrlKey
  if (Boolean(spec.mod) !== modPressed) return false
  if (Boolean(spec.shift) !== e.shiftKey) return false
  if (Boolean(spec.alt) !== e.altKey) return false
  return e.key.toLowerCase() === spec.key.toLowerCase()
}
