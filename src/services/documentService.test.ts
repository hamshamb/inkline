import { describe, expect, it, beforeEach } from 'vitest'
import { createTestDb, type InklineDB } from '../db/schema'
import { DocumentService, ValidationFailedError } from './documentService'
import { UNTITLED } from '../documents/titleUtils'

let db: InklineDB
let service: DocumentService

beforeEach(() => {
  db = createTestDb(`doc-service-${Math.random()}`)
  service = new DocumentService(db)
})

describe('DocumentService.create', () => {
  it('creates a rich document with empty structured content', async () => {
    const doc = await service.create('rich')
    expect(doc.type).toBe('rich')
    expect(doc.title).toBe(UNTITLED)
    expect(doc.content).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
    expect(doc.pinned).toBe(false)
    expect(doc.archived).toBe(false)
    expect(doc.deletedAt).toBeNull()
  })

  it('creates a markdown document with empty string content', async () => {
    const doc = await service.create('markdown')
    expect(doc.content).toBe('')
  })

  it('persists the document so it can be retrieved', async () => {
    const doc = await service.create('plaintext')
    const fetched = await service.get(doc.id)
    expect(fetched).toEqual(doc)
  })
})

describe('DocumentService.saveContent', () => {
  it('updates content and bumps updatedAt', async () => {
    const doc = await service.create('plaintext')
    await new Promise((r) => setTimeout(r, 2))
    const updated = await service.saveContent(doc.id, 'new content')
    expect(updated.content).toBe('new content')
    expect(updated.updatedAt).toBeGreaterThan(doc.createdAt)
  })

  it('derives the title from content when not manually set', async () => {
    const doc = await service.create('plaintext')
    const updated = await service.saveContent(doc.id, 'My New Title\nmore text')
    expect(updated.title).toBe('My New Title')
  })

  it('does not overwrite a manually-set title', async () => {
    const doc = await service.create('plaintext')
    await service.rename(doc.id, 'Custom Title')
    const updated = await service.saveContent(doc.id, 'Completely different content')
    expect(updated.title).toBe('Custom Title')
  })

  it('throws for a non-existent document', async () => {
    await expect(service.saveContent('missing-id', 'x')).rejects.toThrow()
  })
})

describe('DocumentService rename/pin/archive/tags', () => {
  it('rename sets titleIsManual', async () => {
    const doc = await service.create('plaintext')
    const renamed = await service.rename(doc.id, 'Hand-picked title')
    expect(renamed.title).toBe('Hand-picked title')
    expect(renamed.titleIsManual).toBe(true)
  })

  it('renaming to blank falls back to Untitled', async () => {
    const doc = await service.create('plaintext')
    const renamed = await service.rename(doc.id, '   ')
    expect(renamed.title).toBe(UNTITLED)
  })

  it('toggles pinned', async () => {
    const doc = await service.create('plaintext')
    const pinned = await service.setPinned(doc.id, true)
    expect(pinned.pinned).toBe(true)
  })

  it('archiving unpins the document', async () => {
    const doc = await service.create('plaintext')
    await service.setPinned(doc.id, true)
    const archived = await service.setArchived(doc.id, true)
    expect(archived.archived).toBe(true)
    expect(archived.pinned).toBe(false)
  })

  it('sets and de-duplicates tags', async () => {
    const doc = await service.create('plaintext')
    const tagged = await service.setTags(doc.id, ['work', 'work', ' draft '])
    expect(tagged.tags.sort()).toEqual(['draft', 'work'])
  })
})

describe('DocumentService trash lifecycle', () => {
  it('moveToTrash sets deletedAt and unpins', async () => {
    const doc = await service.create('plaintext')
    await service.setPinned(doc.id, true)
    const trashed = await service.moveToTrash(doc.id)
    expect(trashed.deletedAt).not.toBeNull()
    expect(trashed.pinned).toBe(false)
  })

  it('restoreFromTrash clears deletedAt', async () => {
    const doc = await service.create('plaintext')
    await service.moveToTrash(doc.id)
    const restored = await service.restoreFromTrash(doc.id)
    expect(restored.deletedAt).toBeNull()
  })

  it('listActive excludes trashed and archived documents', async () => {
    const a = await service.create('plaintext')
    const b = await service.create('plaintext')
    const c = await service.create('plaintext')
    await service.moveToTrash(a.id)
    await service.setArchived(b.id, true)
    const active = await service.listActive()
    expect(active.map((d) => d.id)).toEqual([c.id])
  })

  it('permanentlyDelete removes the document and its versions', async () => {
    const doc = await service.create('plaintext')
    await db.versions.add({ id: 'v1', documentId: doc.id, content: 'x', createdAt: Date.now(), reason: 'manual', wordCount: 1 })
    await service.permanentlyDelete(doc.id)
    expect(await service.get(doc.id)).toBeUndefined()
    expect(await db.versions.where('documentId').equals(doc.id).count()).toBe(0)
  })

  it('emptyTrash removes every trashed document', async () => {
    const a = await service.create('plaintext')
    const b = await service.create('plaintext')
    await service.moveToTrash(a.id)
    await service.moveToTrash(b.id)
    await service.emptyTrash()
    expect(await service.listTrashed()).toHaveLength(0)
  })
})

describe('DocumentService.duplicate', () => {
  it('creates a copy with a new id and reset lifecycle flags', async () => {
    const doc = await service.create('markdown')
    await service.saveContent(doc.id, '# Original')
    await service.setPinned(doc.id, true)
    const copy = await service.duplicate(doc.id)
    expect(copy.id).not.toBe(doc.id)
    expect(copy.content).toBe('# Original')
    expect(copy.title).toContain('copy')
    expect(copy.pinned).toBe(false)
  })
})

describe('DocumentService validation', () => {
  it('rejects an invalid record via assertValid on updateFields', async () => {
    const doc = await service.create('rich')
    // Force an invalid content type through saveContent for a rich document.
    await expect(service.saveContent(doc.id, 'this should be JSON not a string' as never)).rejects.toThrow(
      ValidationFailedError,
    )
  })
})
