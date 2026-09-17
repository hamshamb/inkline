import type { InklineDB } from '../db/schema'
import { getDb } from '../db/schema'
import { versionRecordSchema } from '../documents/validation'
import { extractPlainText } from '../documents/textExtract'
import { computeTextStats } from '../utils/wordCount'
import { generateId } from '../utils/id'
import type { DocumentRecord, VersionReason, VersionRecord } from '../types/document'
import { DocumentService, documentService } from './documentService'

/** Minimum time between automatic snapshots for the same document. */
const AUTO_VERSION_MIN_INTERVAL_MS = 5 * 60 * 1000
/** Bounded history: oldest snapshots beyond this count are pruned. */
const MAX_VERSIONS_PER_DOCUMENT = 100

function contentEquals(a: DocumentRecord['content'], b: DocumentRecord['content']): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export class VersionService {
  constructor(
    private readonly db: InklineDB = getDb(),
    private readonly documents: DocumentService = documentService,
    /** Injectable for tests that need to simulate elapsed time without mocking global timers (which conflicts with fake-indexeddb's own scheduling). */
    private readonly now: () => number = () => Date.now(),
  ) {}

  async list(documentId: string): Promise<VersionRecord[]> {
    const versions = await this.db.versions.where('documentId').equals(documentId).toArray()
    return versions.sort((a, b) => b.createdAt - a.createdAt)
  }

  async create(documentId: string, content: DocumentRecord['content'], reason: VersionReason): Promise<VersionRecord> {
    const doc = await this.documents.get(documentId)
    const type = doc?.type ?? 'plaintext'
    const stats = computeTextStats(extractPlainText({ type, content }))
    const version: VersionRecord = {
      id: generateId(),
      documentId,
      content,
      createdAt: this.now(),
      reason,
      wordCount: stats.words,
    }
    const result = versionRecordSchema.safeParse(version)
    if (!result.success) throw new Error('Version record failed validation')

    await this.db.versions.add(version)
    await this.prune(documentId)
    return version
  }

  /**
   * Called after a successful autosave. Only creates a snapshot if enough
   * time has passed since the last one AND the content actually changed,
   * so we don't snapshot on every keystroke.
   */
  async createIfDue(documentId: string, content: DocumentRecord['content']): Promise<VersionRecord | undefined> {
    const existing = await this.list(documentId)
    const latest = existing[0]
    if (latest) {
      const dueByTime = this.now() - latest.createdAt >= AUTO_VERSION_MIN_INTERVAL_MS
      const changed = !contentEquals(latest.content, content)
      if (!dueByTime || !changed) return undefined
    }
    return this.create(documentId, content, 'auto')
  }

  async prune(documentId: string): Promise<void> {
    const versions = await this.list(documentId)
    if (versions.length <= MAX_VERSIONS_PER_DOCUMENT) return
    const toDelete = versions.slice(MAX_VERSIONS_PER_DOCUMENT)
    await this.db.versions.bulkDelete(toDelete.map((v) => v.id))
  }

  /**
   * Restores a document to a prior version's content. Saves the document's
   * *current* state as a version first (reason: before-restore), so the
   * restore itself is always reversible.
   */
  async restore(documentId: string, versionId: string): Promise<DocumentRecord> {
    const version = await this.db.versions.get(versionId)
    if (!version || version.documentId !== documentId) {
      throw new Error('Version not found for this document')
    }
    const current = await this.documents.get(documentId)
    if (!current) throw new Error('Document not found')

    await this.create(documentId, current.content, 'before-restore')
    return this.documents.saveContent(documentId, version.content)
  }
}

export const versionService = new VersionService()
