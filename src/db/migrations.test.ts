import { describe, expect, it } from 'vitest'
import Dexie, { type EntityTable } from 'dexie'
import { createTestDb } from './schema'
import { DocumentService } from '../services/documentService'

interface DocV1 {
  id: string
  title: string
}

interface DocV2 extends DocV1 {
  folderId: string | null
}

describe('Dexie migrations', () => {
  it('re-opening the same database at the same version keeps existing data', async () => {
    const name = `migration-reopen-${Math.random()}`
    const db1 = createTestDb(name)
    const service1 = new DocumentService(db1)
    const doc = await service1.create('plaintext')
    await service1.saveContent(doc.id, 'persisted content')
    db1.close()

    const db2 = createTestDb(name)
    const service2 = new DocumentService(db2)
    const reopened = await service2.get(doc.id)
    expect(reopened?.content).toBe('persisted content')
    db2.close()
  })

  it('adding a new version with an upgrade function preserves existing rows and applies the migration', async () => {
    const name = `migration-upgrade-${Math.random()}`

    // Version 1: seed some data under an old schema shape.
    class DbV1 extends Dexie {
      documents!: EntityTable<DocV1, 'id'>
      constructor() {
        super(name)
        this.version(1).stores({ documents: 'id, title' })
      }
    }
    const v1 = new DbV1()
    await v1.documents.bulkAdd([
      { id: 'a', title: 'First' },
      { id: 'b', title: 'Second' },
    ])
    v1.close()

    // Version 2: add an index and backfill a new field via an upgrade transaction —
    // the documented pattern from src/db/schema.ts for future schema changes.
    class DbV2 extends Dexie {
      documents!: EntityTable<DocV2, 'id'>
      constructor() {
        super(name)
        this.version(1).stores({ documents: 'id, title' })
        this.version(2)
          .stores({ documents: 'id, title, folderId' })
          .upgrade(async (tx) => {
            await tx
              .table('documents')
              .toCollection()
              .modify((doc: DocV1) => {
                ;(doc as DocV2).folderId = null
              })
          })
      }
    }
    const v2 = new DbV2()
    const all = await v2.documents.toArray()
    expect(all).toHaveLength(2)
    expect(all.every((d) => d.folderId === null)).toBe(true)
    expect(all.map((d) => d.title).sort()).toEqual(['First', 'Second'])
    v2.close()
  })

  it('never needs to clear the database to add a new index', async () => {
    // Guards the "never solve migration problems by clearing IndexedDB" rule:
    // a version bump that only changes indexes must not lose rows.
    const name = `migration-no-clear-${Math.random()}`
    class DbV1 extends Dexie {
      documents!: EntityTable<DocV1, 'id'>
      constructor() {
        super(name)
        this.version(1).stores({ documents: 'id, title' })
      }
    }
    const v1 = new DbV1()
    await v1.documents.add({ id: 'x', title: 'Keep me' })
    v1.close()

    class DbV2 extends Dexie {
      documents!: EntityTable<DocV1, 'id'>
      constructor() {
        super(name)
        this.version(1).stores({ documents: 'id, title' })
        this.version(2).stores({ documents: 'id, title, *tags' })
      }
    }
    const v2 = new DbV2()
    expect(await v2.documents.get('x')).toEqual({ id: 'x', title: 'Keep me' })
    v2.close()
  })
})
