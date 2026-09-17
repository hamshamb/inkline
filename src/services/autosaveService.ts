import type { DocumentRecord } from '../types/document'
import { DocumentService, documentService } from './documentService'
import { VersionService, versionService } from './versionService'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface PendingSave {
  documentId: string
  content: DocumentRecord['content']
}

/**
 * Debounces editor changes into IndexedDB writes.
 *
 * Flow: schedule() on every editor change -> debounce ~500ms -> validate +
 * write -> status callback. flush() forces an immediate write (Cmd/Ctrl+S,
 * or before switching documents/unmounting) and resolves only once the
 * write has actually completed, so callers can safely swap editors or
 * navigate away afterward without losing data.
 */
export class AutosaveController {
  private timer: ReturnType<typeof setTimeout> | undefined
  private pending: PendingSave | undefined
  private inFlight: Promise<void> | undefined

  constructor(
    private readonly onStatusChange: (status: SaveStatus, error?: Error) => void,
    private readonly debounceMs = 500,
    private readonly documents: DocumentService = documentService,
    private readonly versions: VersionService = versionService,
  ) {}

  schedule(documentId: string, content: DocumentRecord['content']): void {
    this.pending = { documentId, content }
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.flush()
    }, this.debounceMs)
  }

  hasPendingWork(): boolean {
    return this.pending !== undefined || this.inFlight !== undefined
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    if (this.inFlight) {
      await this.inFlight
    }
    if (!this.pending) return

    const job = this.pending
    this.pending = undefined
    this.inFlight = this.performSave(job)
    await this.inFlight
    this.inFlight = undefined

    // A newer edit may have been scheduled while this save was in flight.
    if (this.pending) await this.flush()
  }

  cancel(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    this.pending = undefined
  }

  private async performSave(job: PendingSave): Promise<void> {
    this.onStatusChange('saving')
    try {
      const saved = await this.documents.saveContent(job.documentId, job.content)
      this.onStatusChange('saved')
      void this.versions.createIfDue(job.documentId, saved.content).catch(() => {
        // Version snapshotting is best-effort; a failure here must never
        // be surfaced as a save failure.
      })
    } catch (err) {
      this.onStatusChange('error', err instanceof Error ? err : new Error(String(err)))
    }
  }
}
