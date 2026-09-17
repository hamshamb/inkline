/**
 * Centralized product branding/configuration.
 *
 * The product name is not final. Every place that needs to display or
 * reference the product name, short name, description, or storage
 * namespace should import from here instead of hardcoding a string, so
 * renaming the product later is a one-file change.
 */
export const product = {
  /** Full display name shown in the UI, document titles, etc. */
  name: 'Inkline',
  /** Short name for constrained spaces (PWA home screen icon label). */
  shortName: 'Inkline',
  /** One-line description used in <meta>, manifest, README summaries. */
  description: 'A local-first writing editor. Open it, start writing, everything saves automatically on your device.',
  /**
   * Namespace prefix used for localStorage keys, IndexedDB database name,
   * and any other on-device storage identifiers. Changing this will make
   * existing users' data appear "missing" (it will still be on disk under
   * the old name), so this should only change alongside an explicit
   * migration plan.
   */
  storageNamespace: 'inkline',
  /** Backup file format identifier embedded in exported backup JSON. */
  backupFormatId: 'inkline-backup',
} as const

export type Product = typeof product
