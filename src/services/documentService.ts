import type { InklineDB } from '../db/schema'
import { getDb } from '../db/schema'
import { documentRecordSchema } from '../documents/validation'
import { nextTitleAfterEdit, UNTITLED } from '../documents/titleUtils'
import { generateId } from '../utils/id'
import { emptyContentFor, type DocumentRecord, type DocumentType } from '../types/document'

export class ValidationFailedError extends Error {
  constructor(message: string, public readonly issues: unknown) {
    super(message)
    this.name = 'ValidationFailedError'
  }
}

export class DocumentService {
  constructor(private readonly db: InklineDB = getDb()) {}

  async create(type: DocumentType, opts: { tags?: string[] } = {}): Promise<DocumentRecord> {
    const now = Date.now()
    const record: DocumentRecord = {
      id: generateId(),
      title: UNTITLED,
      type,
      content: emptyContentFor(type),
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      pinned: false,
      archived: false,
      deletedAt: null,
      tags: opts.tags ?? [],
      titleIsManual: false,
    }
    this.assertValid(record)
    await this.db.documents.add(record)
    return record
  }

  async get(id: string): Promise<DocumentRecord | undefined> {
    return this.db.documents.get(id)
  }

  async listActive(): Promise<DocumentRecord[]> {
    return this.db.documents
      .filter((d) => !d.archived && d.deletedAt === null)
      .toArray()
  }

  async listArchived(): Promise<DocumentRecord[]> {
    return this.db.documents.filter((d) => d.archived && d.deletedAt === null).toArray()
  }

  async listTrashed(): Promise<DocumentRecord[]> {
    return this.db.documents.filter((d) => d.deletedAt !== null).toArray()
  }

  async listAll(): Promise<DocumentRecord[]> {
    return this.db.documents.toArray()
  }

  /** Persists new content for a document (used by autosave and version restore). Bumps updatedAt and derives the title unless it was manually set. */
  async saveContent(id: string, content: DocumentRecord['content']): Promise<DocumentRecord> {
    return this.db.transaction('rw', this.db.documents, async () => {
      const existing = await this.db.documents.get(id)
      if (!existing) throw new Error(`Document ${id} not found`)

      const updated: DocumentRecord = {
        ...existing,
        content,
        updatedAt: Date.now(),
      }
      const derivedTitle = nextTitleAfterEdit(updated)
      if (derivedTitle !== undefined) updated.title = derivedTitle

      this.assertValid(updated)
      await this.db.documents.put(updated)
      return updated
    })
  }

  async rename(id: string, title: string): Promise<DocumentRecord> {
    return this.updateFields(id, { title: title.trim() === '' ? UNTITLED : title, titleIsManual: true })
  }

  async setPinned(id: string, pinned: boolean): Promise<DocumentRecord> {
    return this.updateFields(id, { pinned })
  }

  async setArchived(id: string, archived: boolean): Promise<DocumentRecord> {
    // Archiving also unpins, since pinned documents live outside the
    // archived-away sidebar sections.
    return this.updateFields(id, archived ? { archived, pinned: false } : { archived })
  }

  async setTags(id: string, tags: string[]): Promise<DocumentRecord> {
    return this.updateFields(id, { tags: Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))) })
  }

  async moveToTrash(id: string): Promise<DocumentRecord> {
    return this.updateFields(id, { deletedAt: Date.now(), pinned: false })
  }

  async restoreFromTrash(id: string): Promise<DocumentRecord> {
    return this.updateFields(id, { deletedAt: null })
  }

  async permanentlyDelete(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.documents, this.db.versions, async () => {
      await this.db.documents.delete(id)
      await this.db.versions.where('documentId').equals(id).delete()
    })
  }

  async emptyTrash(): Promise<void> {
    const trashed = await this.listTrashed()
    await this.db.transaction('rw', this.db.documents, this.db.versions, async () => {
      for (const doc of trashed) {
        await this.db.documents.delete(doc.id)
        await this.db.versions.where('documentId').equals(doc.id).delete()
      }
    })
  }

  async touchLastOpened(id: string): Promise<void> {
    await this.db.documents.update(id, { lastOpenedAt: Date.now() })
  }

  async duplicate(id: string): Promise<DocumentRecord> {
    const source = await this.db.documents.get(id)
    if (!source) throw new Error(`Document ${id} not found`)
    const now = Date.now()
    const copy: DocumentRecord = {
      ...source,
      id: generateId(),
      title: `${source.title} (copy)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      pinned: false,
      archived: false,
      deletedAt: null,
    }
    this.assertValid(copy)
    await this.db.documents.add(copy)
    return copy
  }

  private async updateFields(id: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord> {
    return this.db.transaction('rw', this.db.documents, async () => {
      const existing = await this.db.documents.get(id)
      if (!existing) throw new Error(`Document ${id} not found`)
      const updated: DocumentRecord = { ...existing, ...patch, updatedAt: Date.now() }
      this.assertValid(updated)
      await this.db.documents.put(updated)
      return updated
    })
  }

  private assertValid(record: DocumentRecord): void {
    const result = documentRecordSchema.safeParse(record)
    if (!result.success) {
      throw new ValidationFailedError('Document record failed validation', result.error.issues)
    }
  }
}

export const documentService = new DocumentService()
