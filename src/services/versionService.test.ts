import { describe, expect, it, beforeEach } from 'vitest'
import { createTestDb, type InklineDB } from '../db/schema'
import { DocumentService } from './documentService'
import { VersionService } from './versionService'

let db: InklineDB
let documents: DocumentService
let versions: VersionService

beforeEach(() => {
  db = createTestDb(`version-service-${Math.random()}`)
  documents = new DocumentService(db)
  versions = new VersionService(db, documents)
})

describe('VersionService.create', () => {
  it('creates a version snapshot with word count and reason', async () => {
    const doc = await documents.create('plaintext')
    const version = await versions.create(doc.id, 'hello there world', 'manual')
    expect(version.documentId).toBe(doc.id)
    expect(version.reason).toBe('manual')
    expect(version.wordCount).toBe(3)
  })

  it('lists versions newest first', async () => {
    const doc = await documents.create('plaintext')
    await versions.create(doc.id, 'first', 'manual')
    await versions.create(doc.id, 'second', 'manual')
    const list = await versions.list(doc.id)
    expect(list).toHaveLength(2)
    expect(list[0]?.content).toBe('second')
  })
})

describe('VersionService.createIfDue (autosave snapshotting)', () => {
  // Time is injected via a constructor clock function rather than mocked
  // globally — global fake timers conflict with fake-indexeddb's own
  // internal scheduling (it schedules transaction completion via
  // setImmediate/setTimeout, which would then never fire).
  function withClock() {
    let currentTime = 1_000_000
    const clock = () => currentTime
    const advance = (ms: number) => {
      currentTime += ms
    }
    const svc = new VersionService(db, documents, clock)
    return { svc, advance }
  }

  it('creates the first snapshot immediately', async () => {
    const doc = await documents.create('plaintext')
    const { svc } = withClock()
    const version = await svc.createIfDue(doc.id, 'content one')
    expect(version).toBeDefined()
  })

  it('does not snapshot again before the minimum interval has passed', async () => {
    const doc = await documents.create('plaintext')
    const { svc, advance } = withClock()
    await svc.createIfDue(doc.id, 'content one')
    advance(60_000) // well under the 5-minute threshold
    const second = await svc.createIfDue(doc.id, 'content two')
    expect(second).toBeUndefined()
  })

  it('does not snapshot when content is unchanged even after the interval', async () => {
    const doc = await documents.create('plaintext')
    const { svc, advance } = withClock()
    await svc.createIfDue(doc.id, 'same content')
    advance(6 * 60_000)
    const second = await svc.createIfDue(doc.id, 'same content')
    expect(second).toBeUndefined()
  })

  it('snapshots again once the interval has passed and content changed', async () => {
    const doc = await documents.create('plaintext')
    const { svc, advance } = withClock()
    await svc.createIfDue(doc.id, 'content one')
    advance(6 * 60_000)
    const second = await svc.createIfDue(doc.id, 'content two')
    expect(second).toBeDefined()
  })
})

describe('VersionService.prune', () => {
  it('keeps at most 100 versions per document, dropping the oldest', async () => {
    const doc = await documents.create('plaintext')
    for (let i = 0; i < 105; i++) {
      await db.versions.add({
        id: `v-${i}`,
        documentId: doc.id,
        content: `content ${i}`,
        createdAt: i, // ascending, so v-0 is oldest
        reason: 'auto',
        wordCount: 2,
      })
    }
    await versions.prune(doc.id)
    const remaining = await versions.list(doc.id)
    expect(remaining).toHaveLength(100)
    expect(remaining.some((v) => v.id === 'v-0')).toBe(false)
    expect(remaining.some((v) => v.id === 'v-104')).toBe(true)
  })
})

describe('VersionService.restore', () => {
  it('restores document content and snapshots the pre-restore state first', async () => {
    const doc = await documents.create('plaintext')
    const v1 = await versions.create(doc.id, 'version one', 'manual')
    await documents.saveContent(doc.id, 'version two (current)')

    const restored = await versions.restore(doc.id, v1.id)
    expect(restored.content).toBe('version one')

    const history = await versions.list(doc.id)
    expect(history.some((v) => v.reason === 'before-restore' && v.content === 'version two (current)')).toBe(true)
  })

  it('throws when restoring a version that belongs to a different document', async () => {
    const docA = await documents.create('plaintext')
    const docB = await documents.create('plaintext')
    const versionOfA = await versions.create(docA.id, 'a content', 'manual')
    await expect(versions.restore(docB.id, versionOfA.id)).rejects.toThrow()
  })
})
