import Dexie, { type EntityTable } from 'dexie'
import { product } from '../config/product'
import type { DocumentRecord, SettingRecord, VersionRecord } from '../types/document'

/**
 * The app's IndexedDB database, versioned via Dexie.
 *
 * Migration policy: NEVER delete or reset this database to resolve a schema
 * change. Add a new `.version(n)` block with `.stores()` describing the new
 * index set and, if data needs reshaping, an `.upgrade()` transaction. Dexie
 * runs versions in order and only applies the ones a given browser hasn't
 * seen yet, so existing user data survives every future release.
 *
 * Example for a hypothetical future version:
 *
 *   this.version(2)
 *     .stores({ documents: 'id, type, updatedAt, pinned, archived, deletedAt, *tags, folderId' })
 *     .upgrade(async (tx) => {
 *       await tx.table('documents').toCollection().modify((doc) => { doc.folderId = null })
 *     })
 */
export class InklineDB extends Dexie {
  documents!: EntityTable<DocumentRecord, 'id'>
  versions!: EntityTable<VersionRecord, 'id'>
  settings!: EntityTable<SettingRecord, 'key'>

  constructor(name: string = `${product.storageNamespace}-db`) {
    super(name)

    this.version(1).stores({
      // Indexes chosen to support the sidebar: filter by archived/deletedAt,
      // sort by updatedAt, filter by pinned, and multi-entry tag lookups.
      documents: 'id, type, updatedAt, pinned, archived, deletedAt, *tags',
      versions: 'id, documentId, createdAt, [documentId+createdAt]',
      settings: 'key',
    })
  }
}

let dbInstance: InklineDB | undefined

/** Lazily-created singleton DB instance used by application services. */
export function getDb(): InklineDB {
  if (!dbInstance) {
    dbInstance = new InklineDB()
  }
  return dbInstance
}

/** Test-only: allows tests to inject an isolated DB instance per test. */
export function createTestDb(name: string): InklineDB {
  return new InklineDB(name)
}

/** Wipes every table. Used only by the explicit, strongly-confirmed "Clear application data" settings action. */
export async function clearAllData(db: InklineDB = getDb()): Promise<void> {
  await db.transaction('rw', db.documents, db.versions, db.settings, async () => {
    await db.documents.clear()
    await db.versions.clear()
    await db.settings.clear()
  })
}

/** Best-effort storage usage estimate for the settings "Storage" panel. */
export async function estimateStorageUsage(): Promise<{ usageBytes: number; quotaBytes: number } | undefined> {
  if (!navigator.storage?.estimate) return undefined
  const { usage, quota } = await navigator.storage.estimate()
  if (usage === undefined || quota === undefined) return undefined
  return { usageBytes: usage, quotaBytes: quota }
}
