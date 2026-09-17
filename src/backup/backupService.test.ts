import { describe, expect, it, beforeEach } from 'vitest'
import { createTestDb, type InklineDB } from '../db/schema'
import { DocumentService } from '../services/documentService'
import { BackupService, InvalidBackupError } from './backupService'
import { product } from '../config/product'
import { BACKUP_FORMAT_VERSION } from './backupSchema'

let db: InklineDB
let documents: DocumentService
let backup: BackupService

beforeEach(() => {
  db = createTestDb(`backup-${Math.random()}`)
  documents = new DocumentService(db)
  backup = new BackupService(db)
})

describe('BackupService.createBackup', () => {
  it('includes all documents and versions', async () => {
    const doc = await documents.create('plaintext')
    await db.versions.add({ id: 'v1', documentId: doc.id, content: 'x', createdAt: Date.now(), reason: 'manual', wordCount: 1 })

    const result = await backup.createBackup()
    expect(result.format).toBe(product.backupFormatId)
    expect(result.version).toBe(BACKUP_FORMAT_VERSION)
    expect(result.documents).toHaveLength(1)
    expect(result.versions).toHaveLength(1)
    expect(typeof result.exportedAt).toBe('string')
  })
})

describe('BackupService.validate', () => {
  it('accepts a backup produced by createBackup', async () => {
    await documents.create('plaintext')
    const created = await backup.createBackup()
    expect(() => backup.validate(created)).not.toThrow()
  })

  it('rejects a payload with the wrong format id', () => {
    expect(() =>
      backup.validate({ format: 'not-inkline', version: 1, exportedAt: new Date().toISOString(), documents: [], versions: [] }),
    ).toThrow(InvalidBackupError)
  })

  it('rejects a payload with malformed documents', () => {
    expect(() =>
      backup.validate({
        format: product.backupFormatId,
        version: BACKUP_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        documents: [{ id: 'x' }], // missing every other required field
        versions: [],
      }),
    ).toThrow(InvalidBackupError)
  })

  it('rejects non-object input', () => {
    expect(() => backup.validate('just a string')).toThrow(InvalidBackupError)
    expect(() => backup.validate(null)).toThrow(InvalidBackupError)
  })

  it('never writes to the database when validation fails', async () => {
    try {
      backup.validate({ format: 'bogus' })
    } catch {
      /* expected */
    }
    expect(await documents.listActive()).toHaveLength(0)
  })
})

describe('BackupService.restore (merge)', () => {
  it('adds documents that do not already exist', async () => {
    const existing = await documents.create('plaintext')
    const fresh = await documents.create('plaintext')
    const snapshot = await backup.createBackup()
    await documents.permanentlyDelete(fresh.id) // simulate it not existing locally anymore

    const summary = await backup.restore(snapshot, 'merge')
    expect(summary.documentsAdded).toBe(1)
    expect(await documents.get(fresh.id)).toBeDefined()
    expect(await documents.get(existing.id)).toBeDefined()
  })

  it('updates a document only when the backup copy is newer', async () => {
    const doc = await documents.create('plaintext')
    const snapshot = await backup.createBackup()
    // Simulate a newer local edit made after the backup was taken.
    await new Promise((r) => setTimeout(r, 2))
    await documents.saveContent(doc.id, 'newer local edit')

    const summary = await backup.restore(snapshot, 'merge')
    expect(summary.documentsSkipped).toBe(1)
    expect((await documents.get(doc.id))?.content).toBe('newer local edit')
  })

  it('does not touch unrelated existing documents', async () => {
    await documents.create('plaintext')
    const summary = await backup.restore(
      { format: product.backupFormatId, version: BACKUP_FORMAT_VERSION, exportedAt: new Date().toISOString(), documents: [], versions: [] },
      'merge',
    )
    expect(summary.documentsAdded).toBe(0)
    expect(await documents.listActive()).toHaveLength(1)
  })
})

describe('BackupService.restore (replace)', () => {
  it('wipes existing documents and replaces them with the backup contents', async () => {
    await documents.create('plaintext')
    await documents.create('markdown')

    const otherDb = createTestDb(`backup-source-${Math.random()}`)
    const otherDocuments = new DocumentService(otherDb)
    const otherBackupService = new BackupService(otherDb)
    await otherDocuments.create('rich')
    const sourceBackup = await otherBackupService.createBackup()

    const summary = await backup.restore(sourceBackup, 'replace')
    expect(summary.documentsAdded).toBe(1)
    const active = await documents.listActive()
    expect(active).toHaveLength(1)
    expect(active[0]?.type).toBe('rich')
  })
})
